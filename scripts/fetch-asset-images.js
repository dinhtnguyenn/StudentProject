import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_JSON_PATH = path.join(PUBLIC_DIR, 'data', 'unity-assets.json');
const ASSET_UPLOAD_FOLDER = 'public/assets';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.GH_OWNER;
let GITHUB_REPO = process.env.GITHUB_REPO || process.env.GH_REPO;
let GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function parseArgs() {
  const args = process.argv.slice(2);
  return args.reduce((result, arg) => {
    if (arg.startsWith('--asset-ids=')) {
      result.assetIds = arg.replace('--asset-ids=', '').split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg.startsWith('--branch=')) {
      result.branch = arg.replace('--branch=', '');
    } else if (arg.startsWith('--owner=')) {
      result.owner = arg.replace('--owner=', '');
    } else if (arg.startsWith('--repo=')) {
      result.repo = arg.replace('--repo=', '');
    }
    return result;
  }, { assetIds: [], force: false, branch: GITHUB_BRANCH, owner: GITHUB_OWNER, repo: GITHUB_REPO });
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
  const res = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Không thể tải trang ${url} - HTTP ${res.status}`);
  return await res.text();
}

async function fetchImageBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Không thể tải ảnh ${url} - HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
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
  const res = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
  if (!res.ok) {
    if (res.status === 404) return null;
    const error = await res.json();
    throw new Error(`GitHub API lỗi khi đọc ${filePath}: ${error.message || res.status}`);
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
    throw new Error(`GitHub upload lỗi ${filePath}: ${errorData.message || res.status}`);
  }
  return (await res.json()).content.sha;
}

async function getGitHubJsonFile(filePath) {
  const apiUrl = getGitHubFileApiPath(filePath);
  const res = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`GitHub API lỗi khi đọc JSON ${filePath}: ${error.message || res.status}`);
  }
  const payload = await res.json();
  const content = Buffer.from(payload.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: payload.sha };
}

function getAssetUploadFilename(asset, imageUrl, extension) {
  const safeId = asset.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `asset-${safeId}.${extension}`;
}

function getRawGithubUrl(filePath) {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
}

async function main() {
  const args = parseArgs();
  GITHUB_OWNER = args.owner || GITHUB_OWNER;
  GITHUB_REPO = args.repo || GITHUB_REPO;
  GITHUB_BRANCH = args.branch || GITHUB_BRANCH;

  if (!GITHUB_TOKEN) {
    throw new Error('Thiếu biến môi trường GITHUB_TOKEN. Vui lòng export GITHUB_TOKEN trước khi chạy.');
  }
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Thiếu GITHUB_OWNER hoặc GITHUB_REPO. Export GITHUB_OWNER và GITHUB_REPO hoặc dùng --owner/--repo.');
  }

  const enabledAssetIds = new Set(args.assetIds);
  const forceUpdate = args.force;

  const rawJson = await fs.readFile(ASSETS_JSON_PATH, 'utf8');
  const assets = JSON.parse(rawJson);
  let updated = false;
  let processedCount = 0;
  let updatedCount = 0;
  let uploadCount = 0;

  for (const asset of assets) {
    if (enabledAssetIds.size && !enabledAssetIds.has(asset.id)) continue;
    if (!asset.originalLink) {
      console.warn(`Bỏ qua ${asset.id}: không có originalLink`);
      continue;
    }

    const hasImage = typeof asset.imageUrl === 'string' && asset.imageUrl.trim().length > 0;
    if (hasImage && !forceUpdate) {
      console.log(`Bỏ qua ${asset.id}: đã có imageUrl`);
      continue;
    }

    processedCount += 1;
    console.log(`Xử lý ${asset.id} (${asset.originalLink})...`);

    try {
      const html = await fetchHtml(asset.originalLink);
      const imageUrl = extractImageFromHtml(html);
      if (!imageUrl) {
        console.warn(`Không tìm thấy meta ảnh cho ${asset.id}`);
        continue;
      }

      const normalizedImageUrl = normalizeUrl(imageUrl);
      const extensionFromUrl = extractExtensionFromUrl(normalizedImageUrl);
      let extension = extensionFromUrl;
      let buffer = null;

      try {
        const res = await fetch(normalizedImageUrl, { headers: { 'User-Agent': userAgent }, redirect: 'follow' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        if (!extension) {
          extension = getExtensionFromContentType(res.headers.get('content-type')) || 'jpg';
        }
      } catch (error) {
        console.warn(`Không tải được ảnh trực tiếp: ${error.message}. Tiếp tục thử tải với URL ban đầu.`);
        continue;
      }

      extension = extension || 'jpg';
      const uploadFilename = getAssetUploadFilename(asset, normalizedImageUrl, extension);
      const uploadPath = `${ASSET_UPLOAD_FOLDER}/${uploadFilename}`;
      const rawGithubUrl = getRawGithubUrl(uploadPath);

      const sha = await getGitHubFileSha(uploadPath);
      await uploadFileToGitHub(uploadPath, buffer, `Upload asset preview image ${uploadFilename} [skip ci]`, sha || undefined);
      console.log(`Uploaded image for ${asset.id} → ${uploadPath}`);
      uploadCount += 1;

      asset.imageUrl = rawGithubUrl;
      updated = true;
      updatedCount += 1;
    } catch (error) {
      console.error(`Lỗi khi xử lý asset ${asset.id}: ${error.message}`);
    }
  }

  if (updated) {
    const updatedJson = JSON.stringify(assets, null, 2) + '\n';
    await fs.writeFile(ASSETS_JSON_PATH, updatedJson, 'utf8');
    const jsonSha = await getGitHubFileSha('public/data/unity-assets.json');
    await uploadFileToGitHub('public/data/unity-assets.json', Buffer.from(updatedJson, 'utf8'), `Update unity-assets.json with uploaded preview images [skip ci]`, jsonSha || undefined);
    console.log('Cập nhật public/data/unity-assets.json và commit lên GitHub.');
  }

  console.log(`Hoàn thành. Đã xử lý ${processedCount} asset, cập nhật ${updatedCount} ảnh, upload ${uploadCount} file ảnh.`);
}

main().catch(error => {
  console.error('Lỗi script:', error.message);
  process.exit(1);
});
