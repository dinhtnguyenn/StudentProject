/**
 * fetch-asset-images.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Dùng Playwright lấy og:image URL từ originalLink (Unity / Fab)
 * 2. Tải file ảnh về public/asset-images/{assetId}.jpg
 * 3. Ghi imageUrl = "/asset-images/{assetId}.jpg" vào unity-assets.json
 *
 * Không còn bị hotlink protection vì ảnh được serve từ localhost.
 *
 * Yêu cầu: npm install -D playwright
 * Chạy:    node scripts/fetch-asset-images.mjs
 *
 * Options:
 *   --overwrite   Ghi đè cả những asset đã có imageUrl
 *   --limit=N     Chỉ xử lý N asset đầu tiên (để test)
 *   --dry-run     Chỉ in kết quả ra console, không tải ảnh và không ghi file
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH   = path.join(__dirname, '../public/data/unity-assets.json');
const IMAGE_DIR   = path.join(__dirname, '../public/asset-images');
const IMAGE_ROUTE = '/asset-images'; // URL prefix in the browser

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const OVERWRITE = args.includes('--overwrite');
const DRY_RUN   = args.includes('--dry-run');
const limitArg  = args.find(a => a.startsWith('--limit='));
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

// ─── Ensure output dir exists ─────────────────────────────────────────────────
if (!DRY_RUN && !existsSync(IMAGE_DIR)) {
  mkdirSync(IMAGE_DIR, { recursive: true });
  console.log(`📁 Tạo thư mục: ${IMAGE_DIR}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Lấy extension từ URL (mặc định .jpg) */
function getExt(url) {
  const u = url.split('?')[0];
  const m = u.match(/\.(webp|png|jpg|jpeg|gif|avif)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

/** Tải file ảnh về local, trả về đường dẫn file hoặc null nếu lỗi */
function downloadImage(imgUrl, destPath) {
  return new Promise((resolve) => {
    const client = imgUrl.startsWith('https') ? https : http;
    const req = client.get(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': imgUrl.includes('fab.com') ? 'https://www.fab.com/' : 'https://assetstore.unity.com/',
      }
    }, (res) => {
      // Theo redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImage(res.headers.location, destPath));
      }
      if (res.statusCode !== 200) return resolve(null);

      const contentType = res.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) return resolve(null);

      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          writeFileSync(destPath, Buffer.concat(chunks));
          resolve(destPath);
        } catch {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
  });
}

/** Lấy og:image từ trang web bằng Playwright */
async function fetchOgImage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // fab.com là SPA (React) → chờ thêm để render
    if (url.includes('fab.com')) {
      await page.waitForTimeout(4000);
    }

    const ogImage = await page.evaluate(() => {
      const selectors = [
        'meta[property="og:image"]',
        'meta[name="og:image"]',
        'meta[property="twitter:image"]',
        'meta[name="twitter:image"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const content = el.getAttribute('content');
          if (content && content.startsWith('http')) return content;
        }
      }
      return null;
    });

    return ogImage;
  } catch {
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const assets = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

  // Lọc những asset cần xử lý
  const toProcess = assets
    .filter(a => {
      if (!a.originalLink) return false;
      if (OVERWRITE) return true;
      // Bỏ qua nếu imageUrl đã trỏ đến file local
      return !a.imageUrl || !a.imageUrl.startsWith(IMAGE_ROUTE);
    })
    .slice(0, LIMIT);

  if (toProcess.length === 0) {
    console.log('✅ Không có asset nào cần cập nhật. Dùng --overwrite để làm lại tất cả.');
    return;
  }

  console.log(`\n🚀 Bắt đầu xử lý ${toProcess.length} asset${DRY_RUN ? ' (DRY RUN — không tải ảnh)' : ''}...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const asset = toProcess[i];
    const label = `[${String(i + 1).padStart(3)}/${toProcess.length}]`;
    const name  = asset.name.slice(0, 55).padEnd(55);

    process.stdout.write(`${label} ${name} → `);

    // 1. Lấy og:image URL
    const ogUrl = await fetchOgImage(page, asset.originalLink);

    if (!ogUrl) {
      console.log('❌ Không tìm thấy og:image');
      failCount++;
      if (i < toProcess.length - 1) await sleep(500);
      continue;
    }

    if (DRY_RUN) {
      console.log(`🔍 ${ogUrl.slice(0, 75)}`);
      successCount++;
      if (i < toProcess.length - 1) await sleep(200);
      continue;
    }

    // 2. Tải ảnh về local
    const ext      = getExt(ogUrl);
    const filename = `${asset.id}.${ext}`;
    const destPath = path.join(IMAGE_DIR, filename);
    const localUrl = `${IMAGE_ROUTE}/${filename}`;

    const saved = await downloadImage(ogUrl, destPath);

    if (saved) {
      // 3. Cập nhật imageUrl trong mảng gốc
      const original = assets.find(a => a.id === asset.id);
      if (original) original.imageUrl = localUrl;
      console.log(`✅ → ${localUrl}`);
      successCount++;
    } else {
      console.log(`⚠️  Tải ảnh thất bại (og:image tìm thấy nhưng download lỗi)`);
      failCount++;
    }

    // Delay nhỏ tránh rate-limit
    if (i < toProcess.length - 1) await sleep(600);
  }

  await browser.close();

  // ─── Ghi JSON ─────────────────────────────────────────────────────────────
  if (!DRY_RUN) {
    writeFileSync(DATA_PATH, JSON.stringify(assets, null, 2), 'utf-8');
    console.log(`\n💾 Đã ghi ${DATA_PATH}`);
    console.log(`🖼️  Ảnh lưu tại: ${IMAGE_DIR}`);
  }

  console.log(`\n📊 Kết quả: ✅ ${successCount} thành công | ❌ ${failCount} thất bại\n`);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
