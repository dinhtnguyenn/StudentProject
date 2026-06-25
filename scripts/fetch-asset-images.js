import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_JSON_PATH = path.join(PUBLIC_DIR, 'data', 'unity-assets.json');
const ASSET_UPLOAD_FOLDER = 'public/assets';
const TEMP_IMAGE_DIR = path.join(__dirname, '.temp-images');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.GH_OWNER;
let GITHUB_REPO = process.env.GITHUB_REPO || process.env.GH_REPO;
let GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function parseArgs() {
  const args = process.argv.slice(2);
  return args.reduce((result, arg) => {
    if (arg.startsWith('--asset-ids=')) {
      result.assetIds = arg.replace('--asset-ids=', '').split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--debug') {
      result.debug = true;
    } else if (arg.startsWith('--branch=')) {
      result.branch = arg.replace('--branch=', '');
    } else if (arg.startsWith('--owner=')) {
      result.owner = arg.replace('--owner=', '');
    } else if (arg.startsWith('--repo=')) {
      result.repo = arg.replace('--repo=', '');
    }
    return result;
  }, { assetIds: [], force: false, debug: false, branch: GITHUB_BRANCH, owner: GITHUB_OWNER, repo: GITHUB_REPO });
}

function normalizeUrl(url) {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

function extractImageFromHtml(html) {
  const patterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    /<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return normalizeUrl(match[1].trim());
    }
  }
  return null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchFabImageUrl(url, debug = false) {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ]
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(10000);
    page.setDefaultTimeout(10000);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Try to get og:image meta tag
    const ogImage = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null);
    if (ogImage) return normalizeUrl(ogImage);
    
    // Try twitter:image meta tag
    const twitterImage = await page.$eval('meta[name="twitter:image"]', el => el.content).catch(() => null);
    if (twitterImage) return normalizeUrl(twitterImage);
    
    // Try to find image in page content (Fab might load dynamically)
    const pageContent = await page.content();
    if (debug && pageContent.length > 0) {
      const hasOgImage = pageContent.includes('og:image');
      console.log(`  [DEBUG] Page loaded: ${pageContent.length} bytes, has og:image: ${hasOgImage}`);
    }
    const imageUrl = extractImageFromHtml(pageContent);
    if (imageUrl) return imageUrl;
    
    // Try to find any image in main content area
    const mainImage = await page.$eval('img[src*="cdn"]', el => el.src).catch(() => null);
    if (mainImage) return normalizeUrl(mainImage);
    
    // Try to find first visible image
    const firstImage = await page.$eval('img[loading="lazy"], img:not([class*="social"]), img:not([class*="icon"])', el => el.src).catch(() => null);
    if (firstImage && debug) {
      console.log(`  [DEBUG] Found image element: ${firstImage.substring(0, 80)}...`);
    }
    if (firstImage) return normalizeUrl(firstImage);
    
    throw new Error('No image meta tags or images found');
  } finally {
    if (browser) await browser.close();
  }
}

function extractExtensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{3,4})$/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function getExtensionFromContentType(contentType) {
  if (!contentType) return null;
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return null;
}

function getGitHubFileApiPath(filePath) {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
}

async function getGitHubFileSha(filePath) {
  const url = getGitHubFileApiPath(filePath);
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const error = await res.json();
    throw new Error(`GitHub API: ${error.message || res.status}`);
  }
  const data = await res.json();
  return data.sha;
}

async function uploadFileToGitHub(filePath, contentBuffer, message, sha) {
  const apiUrl = getGitHubFileApiPath(filePath);
  const base64Content = contentBuffer.toString('base64');
  const body = {
    message,
    content: base64Content,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`GitHub upload: ${errorData.message || res.status}`);
  }
  return (await res.json()).content.sha;
}

function getAssetUploadFilename(asset, imageUrl, extension) {
  const safeId = asset.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `asset-${safeId}.${extension}`;
}

function getPublicAssetUrl(filePath) {
  return `/${filePath.replace(/^public\//, '')}`;
}

function resolveStoredImageUrl(imageUrl) {
  if (!imageUrl?.trim()) return null;
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) return imageUrl;
  const match = imageUrl.match(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/public\/(.+)$/i);
  if (match) return `/${match[1]}`;
  return imageUrl;
}

async function checkLocalImageExists(relativePath) {
  const localPath = path.join(PUBLIC_DIR, relativePath.replace(/^\//, ''));
  try {
    const stat = await fs.stat(localPath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function checkRemoteImageExists(url) {
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
    });
    if (headRes.ok) return true;

    if ([403, 405].includes(headRes.status)) {
      const getRes = await fetch(url, {
        headers: { 'User-Agent': userAgent, Range: 'bytes=0-512' },
        redirect: 'follow',
      });
      return getRes.ok || getRes.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

async function imageExists(imageUrl, debug = false) {
  const resolved = resolveStoredImageUrl(imageUrl);
  if (!resolved) return false;

  if (resolved.startsWith('/')) {
    if (await checkLocalImageExists(resolved)) {
      if (debug) console.log(`  [DEBUG] Local file exists: public${resolved}`);
      return true;
    }

    const githubPath = `public${resolved}`;
    const sha = await getGitHubFileSha(githubPath);
    if (sha) {
      if (debug) console.log(`  [DEBUG] GitHub file exists: ${githubPath}`);
      return true;
    }

    if (debug) console.log(`  [DEBUG] Image missing: ${resolved}`);
    return false;
  }

  const remoteExists = await checkRemoteImageExists(resolved);
  if (debug) console.log(`  [DEBUG] Remote image ${remoteExists ? 'exists' : 'missing'}: ${resolved}`);
  return remoteExists;
}

async function fetchImageFromSource(asset, isDebug) {
  const isFabLink = asset.originalLink.includes('fab.com');
  let imageUrl = null;

  if (isFabLink) {
    imageUrl = await fetchFabImageUrl(asset.originalLink, isDebug);
    if (isDebug) console.log(`  [DEBUG] Puppeteer extracted Fab image: ${imageUrl}`);
    return imageUrl;
  }

  const html = await fetchHtml(asset.originalLink);
  if (isDebug) {
    console.log(`  [DEBUG] HTML length: ${html.length} bytes`);
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*>/);
    if (ogMatch) console.log(`  [DEBUG] og:image found: yes`);
  }
  return extractImageFromHtml(html);
}

async function downloadImageBuffer(normalizedImageUrl, isDebug) {
  const res = await fetch(normalizedImageUrl, {
    headers: { 'User-Agent': userAgent },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extensionFromUrl = extractExtensionFromUrl(normalizedImageUrl);
  let extension = extensionFromUrl || getExtensionFromContentType(res.headers.get('content-type')) || 'jpg';

  if (isDebug) console.log(`  [DEBUG] Downloaded image: ${buffer.length} bytes, ext: ${extension}`);
  return { buffer, extension };
}

async function processAssetImage(asset, isDebug) {
  const isFabLink = asset.originalLink.includes('fab.com');
  let imageUrl = null;

  try {
    imageUrl = await fetchImageFromSource(asset, isDebug);
  } catch (fabError) {
    if (isFabLink) {
      if (isDebug) console.log(`  [DEBUG] Puppeteer error: ${fabError.message}`);
      console.warn(`  ✗ Fab error: ${fabError.message}`);
      console.warn(`  💡 Tip: Check if the Fab link is still active. Some listings may have been removed.`);
    }
    throw fabError;
  }

  if (!imageUrl) {
    throw new Error('No image meta found');
  }

  const normalizedImageUrl = normalizeUrl(imageUrl);
  const { buffer, extension } = await downloadImageBuffer(normalizedImageUrl, isDebug);

  const uploadFilename = getAssetUploadFilename(asset, normalizedImageUrl, extension);
  const uploadPath = `${ASSET_UPLOAD_FOLDER}/${uploadFilename}`;
  const publicAssetUrl = getPublicAssetUrl(uploadPath);
  const localAssetPath = path.join(PUBLIC_DIR, 'assets', uploadFilename);

  const tempFilePath = path.join(TEMP_IMAGE_DIR, uploadFilename);
  await fs.writeFile(tempFilePath, buffer);
  await fs.mkdir(path.dirname(localAssetPath), { recursive: true });
  await fs.writeFile(localAssetPath, buffer);
  if (isDebug) console.log(`  [DEBUG] Saved temp + local file: ${localAssetPath}`);

  try {
    const sha = await getGitHubFileSha(uploadPath);
    await uploadFileToGitHub(
      uploadPath,
      buffer,
      `Upload asset preview image ${uploadFilename} [skip ci]`,
      sha || undefined
    );
    console.log(`  ✓ Uploaded: ${uploadPath}`);
    await deleteTempFile(tempFilePath);
    if (isDebug) console.log(`  [DEBUG] Deleted temp file: ${tempFilePath}`);
  } catch (uploadError) {
    await deleteTempFile(tempFilePath);
    throw uploadError;
  }

  return publicAssetUrl;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_IMAGE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function deleteTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function cleanupTempDir() {
  try {
    const files = await fs.readdir(TEMP_IMAGE_DIR);
    if (files.length === 0) {
      await fs.rmdir(TEMP_IMAGE_DIR);
    }
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      console.warn(`Warning: Failed to cleanup temp dir: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs();
  GITHUB_OWNER = args.owner || GITHUB_OWNER;
  GITHUB_REPO = args.repo || GITHUB_REPO;
  GITHUB_BRANCH = args.branch || GITHUB_BRANCH;
  const isDebug = args.debug;

  await ensureTempDir();

  if (!GITHUB_TOKEN) {
    throw new Error('Missing GITHUB_TOKEN env var');
  }
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_OWNER or GITHUB_REPO');
  }

  const enabledAssetIds = new Set(args.assetIds);
  const forceUpdate = args.force;

  const rawJson = await fs.readFile(ASSETS_JSON_PATH, 'utf8');
  const assets = JSON.parse(rawJson);
  let updated = false;
  let processedCount = 0;
  let updatedCount = 0;
  let uploadCount = 0;
  let skippedCount = 0;
  let refetchedCount = 0;

  for (const asset of assets) {
    if (enabledAssetIds.size && !enabledAssetIds.has(asset.id)) continue;
    if (!asset.originalLink) {
      console.warn(`Skip ${asset.id}: no originalLink`);
      skippedCount += 1;
      continue;
    }

    const hasImage = typeof asset.imageUrl === 'string' && asset.imageUrl.trim().length > 0;
    if (hasImage && !forceUpdate) {
      const exists = await imageExists(asset.imageUrl, isDebug);
      if (exists) {
        console.log(`Skip ${asset.id}: image exists (${asset.imageUrl})`);
        skippedCount += 1;
        continue;
      }
      console.log(`Re-fetch ${asset.id}: image missing (${asset.imageUrl})`);
      refetchedCount += 1;
    }

    processedCount += 1;
    console.log(`Processing ${asset.id} (${asset.originalLink.substring(0, 50)}...)`);

    try {
      const publicAssetUrl = await processAssetImage(asset, isDebug);
      uploadCount += 1;
      asset.imageUrl = publicAssetUrl;
      updated = true;
      updatedCount += 1;
    } catch (error) {
      console.warn(`  ✗ ${error.message}`);
      skippedCount += 1;
    }

    await delay(500);
  }

  if (updated) {
    const updatedJson = JSON.stringify(assets, null, 2) + '\n';
    await fs.writeFile(ASSETS_JSON_PATH, updatedJson, 'utf8');
    const jsonSha = await getGitHubFileSha('public/data/unity-assets.json');
    await uploadFileToGitHub(
      'public/data/unity-assets.json',
      Buffer.from(updatedJson, 'utf8'),
      'Update unity-assets.json with uploaded preview images [skip ci]',
      jsonSha || undefined
    );
    console.log('✓ Updated public/data/unity-assets.json on GitHub');
  }

  console.log(
    `\n📊 Summary: processed=${processedCount}, updated=${updatedCount}, refetched=${refetchedCount}, uploaded=${uploadCount}, skipped=${skippedCount}`
  );

  // Cleanup temp directory
  await cleanupTempDir();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
