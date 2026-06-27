const MODULE_MAP = {
  'public/data/projects.json': 'projects',
  'public/data/articles.json': 'articles',
  'public/data/unity-assets.json': 'assets',
  'public/data/categories.json': 'categories',
  'public/data/majors.json': 'majors',
  'public/data/articleTypes.json': 'articleTypes',
  'public/data/asset-types.json': 'assetTypes',
  'public/data/asset-sources.json': 'assetSources',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, { headers: corsHeaders });
  } else {
    return new Response(null, { headers: { Allow: 'GET, HEAD, POST, PUT, DELETE, OPTIONS' } });
  }
}

async function fetchFromGithub(env, path) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Unifolio-Worker',
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.content) {
    const text = atob(data.content.replace(/\n/g, ''));
    try {
      return new TextDecoder('utf-8').decode(Uint8Array.from(text, c => c.charCodeAt(0)));
    } catch {
      return decodeURIComponent(escape(text));
    }
  }
  return null;
}

async function verifyAuth(env, username, password) {
  if (username === 'admin' && password === env.ADMIN_PASSWORD) {
    return {
      username: 'admin',
      role: 'SUPERADMIN',
      permissions: {
        projects: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        articles: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        assets: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        categories: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        majors: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        articleTypes: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        assetTypes: { view: true, add: true, edit: 'ALL', delete: 'ALL' },
        assetSources: { view: true, add: true, edit: 'ALL', delete: 'ALL' }
      }
    };
  }

  const usersStr = await env.UNIFOLIO_USERS.get('users');
  if (!usersStr) return null;
  
  const users = JSON.parse(usersStr);
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

// ─── XOR Encryption (simple, reversible, key from env) ───────────────────────
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded, key) {
  const raw = atob(encoded);
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// ─── Brute-force Rate Limiting ────────────────────────────────────────────────
const MAX_FAILS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

async function checkBruteForce(env, email, resourceId) {
  const key = `brute:${email}:${resourceId}`;
  const raw = await env.UNIFOLIO_USERS.get(key);
  if (!raw) return { blocked: false, remaining: MAX_FAILS };
  const state = JSON.parse(raw);
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const mins = Math.ceil((state.lockedUntil - Date.now()) / 60000);
    return { blocked: true, lockedUntil: state.lockedUntil, mins };
  }
  // Expired lockout, reset
  if (state.lockedUntil && Date.now() >= state.lockedUntil) {
    await env.UNIFOLIO_USERS.delete(key);
    return { blocked: false, remaining: MAX_FAILS };
  }
  return { blocked: false, remaining: MAX_FAILS - (state.count || 0) };
}

async function recordFailedAttempt(env, email, resourceId, ipAddress) {
  const key = `brute:${email}:${resourceId}`;
  const raw = await env.UNIFOLIO_USERS.get(key);
  let state = raw ? JSON.parse(raw) : { count: 0, attempts: [] };
  state.count = (state.count || 0) + 1;
  state.attempts = [...(state.attempts || []), { time: Date.now(), ip: ipAddress }].slice(-20);
  if (state.count >= MAX_FAILS) {
    state.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  await env.UNIFOLIO_USERS.put(key, JSON.stringify(state), { expirationTtl: 3600 });
  return state;
}

async function resetFailedAttempts(env, email, resourceId) {
  const key = `brute:${email}:${resourceId}`;
  await env.UNIFOLIO_USERS.delete(key);
}

// ─── Access Logging ───────────────────────────────────────────────────────────
async function logAccess(env, { resourceId, email, code, success, reason, ipAddress, userAgent }) {
  const logKey = 'drive_access_log';
  const raw = await env.UNIFOLIO_USERS.get(logKey) || '[]';
  const logs = JSON.parse(raw);
  logs.unshift({
    id: Date.now().toString(),
    time: Date.now(),
    resourceId,
    email,
    code: code ? code.substring(0, 2) + '****' : '?', // mask code in log
    success,
    reason: reason || null,
    ip: ipAddress,
    ua: userAgent ? userAgent.substring(0, 80) : null
  });
  // Keep last 500 logs
  const trimmed = logs.slice(0, 500);
  await env.UNIFOLIO_USERS.put(logKey, JSON.stringify(trimmed));
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const ua = request.headers.get('User-Agent') || '';

    try {
      if (url.pathname === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const user = await verifyAuth(env, body.username, body.password);
        if (!user) return new Response(JSON.stringify({ error: 'Sai tài khoản hoặc mật khẩu' }), { status: 401, headers: corsHeaders });
        const { password, ...safeUser } = user;
        return new Response(JSON.stringify(safeUser), { status: 200, headers: corsHeaders });
      }

      if (url.pathname === '/api/users') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const [username, password] = atob(authHeader.split(' ')[1]).split(':');
        const user = await verifyAuth(env, username, password);
        
        if (!user || user.role !== 'SUPERADMIN') {
          return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }

        if (request.method === 'GET') {
          const usersStr = await env.UNIFOLIO_USERS.get('users') || '[]';
          const users = JSON.parse(usersStr).map(u => {
            const { password, ...rest } = u; 
            return rest;
          });
          return new Response(JSON.stringify(users), { headers: corsHeaders });
        }
        
        if (request.method === 'POST') {
          const newUsers = await request.json();
          await env.UNIFOLIO_USERS.put('users', JSON.stringify(newUsers));
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      //  DRIVE ACCESS CONTROL
      // ═══════════════════════════════════════════════════════════════════════
      if (url.pathname.startsWith('/api/drive-access')) {

        // ── PUBLIC: request access ───────────────────────────────────────────
        if (url.pathname === '/api/drive-access/request' && request.method === 'POST') {
          const body = await request.json();
          const reqsStr = await env.UNIFOLIO_USERS.get('drive_access_requests') || '[]';
          let reqs = JSON.parse(reqsStr);
          const newReq = {
             id: Date.now().toString(),
             ...body, 
             createdAt: Date.now(),
             status: 'pending'
          };
          reqs.push(newReq);
          await env.UNIFOLIO_USERS.put('drive_access_requests', JSON.stringify(reqs));

          // Send notification email to admin
          const GAS_URL = "https://script.google.com/macros/s/AKfycbzczlHzPEtPko7GC6g1gl1JTfXdglZI6MfTScjkW49LdZdFVYyRcZr7DqtmdYYohpBf1g/exec";
          const GAS_TOKEN = "unifolio-secret-999";
          const clientOrigin = request.headers.get('Origin') || 'https://www.unifolio.io.vn';
          const htmlBody = `
            <h2>Có yêu cầu cấp quyền mới</h2>
            <p><strong>Người gửi:</strong> ${newReq.name} (${newReq.studentId})</p>
            <p><strong>Email:</strong> ${newReq.email}</p>
            <p><strong>Tài nguyên:</strong> ${newReq.resourceName}</p>
            <p><strong>Lý do:</strong> ${newReq.message}</p>
            <p><a href="${clientOrigin}/admin">Vào Admin để duyệt</a></p>
          `;
          try {
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                token: GAS_TOKEN,
                subject: `[Yêu cầu cấp quyền] ${newReq.resourceName} - ${newReq.studentId}`,
                htmlBody: htmlBody
              })
            });

            // Send notification email to student
            const studentHtmlBody = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #10B981; color: white; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Yêu Cầu Đã Được Tiếp Nhận</h1>
                </div>
                <div style="padding: 24px; background-color: #f9fafb;">
                  <p>Chào <strong>${newReq.name}</strong>,</p>
                  <p>Hệ thống đã ghi nhận yêu cầu xin cấp quyền truy cập tài nguyên của bạn.</p>
                  <p><strong>Tài nguyên:</strong> ${newReq.resourceName}</p>
                  <p>Unifolio sẽ xem xét và phản hồi qua email này trong thời gian sớm nhất.</p>
                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Trân trọng,<br>Unifolio Team</p>
                </div>
              </div>
            `;
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                token: GAS_TOKEN,
                toAddress: newReq.email,
                subject: `[Unifolio] Đã tiếp nhận yêu cầu: ${newReq.resourceName}`,
                htmlBody: studentHtmlBody
              })
            });
          } catch(e) { console.error(e); }

          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // ── PUBLIC: verify ──────────────────────────────────────────────────
        if (url.pathname === '/api/drive-access/verify' && request.method === 'POST') {
          const { resourceId, email, code } = await request.json();
          if (!resourceId || !email || !code) {
            return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400, headers: corsHeaders });
          }

          // 1. Brute-force check
          const bruteState = await checkBruteForce(env, email, resourceId);
          if (bruteState.blocked) {
            const msg = `Quá nhiều lần thử sai. Vui lòng thử lại sau ${bruteState.mins} phút.`;
            await logAccess(env, { resourceId, email, code, success: false, reason: 'LOCKED', ipAddress: ip, userAgent: ua });
            return new Response(JSON.stringify({ error: msg }), { status: 429, headers: corsHeaders });
          }

          // 2. Find the access code
          const ENCRYPT_KEY = env.DRIVE_ENCRYPT_KEY || 'unifolio-default-key-2024';
          const codesStr = await env.UNIFOLIO_USERS.get('drive_access_codes') || '[]';
          const codes = JSON.parse(codesStr);
          const validCode = codes.find(c => 
            c.resourceId === resourceId && 
            c.email.toLowerCase() === email.toLowerCase() && 
            c.code === code
          );

          if (!validCode) {
            await recordFailedAttempt(env, email, resourceId, ip);
            const newState = await checkBruteForce(env, email, resourceId);
            const rem = newState.remaining - 1;
            await logAccess(env, { resourceId, email, code, success: false, reason: 'WRONG_CODE', ipAddress: ip, userAgent: ua });
            const errMsg = rem <= 0 
              ? `Sai email hoặc mã bảo vệ. Tài khoản bị khóa 30 phút.`
              : `Sai email hoặc mã bảo vệ. Còn ${rem} lần thử.`;
            return new Response(JSON.stringify({ error: errMsg }), { status: 403, headers: corsHeaders });
          }

          // 3. Check expiry
          if (validCode.expiresAt && Date.now() > validCode.expiresAt) {
            await logAccess(env, { resourceId, email, code, success: false, reason: 'EXPIRED', ipAddress: ip, userAgent: ua });
            return new Response(JSON.stringify({ error: 'Mã bảo vệ đã hết hạn' }), { status: 403, headers: corsHeaders });
          }

          // 4. Check usage limit
          if (validCode.maxUses && validCode.usedCount >= validCode.maxUses) {
            await logAccess(env, { resourceId, email, code, success: false, reason: 'MAX_USES_REACHED', ipAddress: ip, userAgent: ua });
            return new Response(JSON.stringify({ error: `Mã bảo vệ đã được sử dụng đủ ${validCode.maxUses} lần` }), { status: 403, headers: corsHeaders });
          }

          // 5. SUCCESS — increment usage, reset brute-force, log
          const updatedCodes = codes.map(c => 
            c.id === validCode.id 
              ? { ...c, usedCount: (c.usedCount || 0) + 1 }
              : c
          );
          await env.UNIFOLIO_USERS.put('drive_access_codes', JSON.stringify(updatedCodes));
          await resetFailedAttempts(env, email, resourceId);
          await logAccess(env, { resourceId, email, code, success: true, reason: 'OK', ipAddress: ip, userAgent: ua });

          // 6. Decrypt and return the actual drive link
          let driveLink = validCode.encryptedDriveLink 
            ? xorDecrypt(validCode.encryptedDriveLink, ENCRYPT_KEY)
            : validCode.driveLink || null;

          return new Response(JSON.stringify({ success: true, driveLink }), { headers: corsHeaders });
        }

        // ── ADMIN-ONLY endpoints ────────────────────────────────────────────
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const [username, password] = atob(authHeader.split(' ')[1]).split(':');
        const user = await verifyAuth(env, username, password);
        
        if (!user || (user.role !== 'SUPERADMIN' && !(user.permissions?.assets?.edit))) {
          return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }

        // GET: list access requests
        if (url.pathname === '/api/drive-access/requests' && request.method === 'GET') {
          const reqsStr = await env.UNIFOLIO_USERS.get('drive_access_requests') || '[]';
          return new Response(reqsStr, { headers: corsHeaders });
        }

        // POST: approve access request
        if (url.pathname === '/api/drive-access/requests/approve' && request.method === 'POST') {
          const { id, durationDays, maxUses, driveLink } = await request.json();
          const reqsStr = await env.UNIFOLIO_USERS.get('drive_access_requests') || '[]';
          let reqs = JSON.parse(reqsStr);
          const reqIndex = reqs.findIndex(r => r.id === id);
          if (reqIndex === -1) return new Response('Not found', { status: 404, headers: corsHeaders });
          const reqData = reqs[reqIndex];

          const ENCRYPT_KEY = env.DRIVE_ENCRYPT_KEY || 'unifolio-default-key-2024';
          const codesStr = await env.UNIFOLIO_USERS.get('drive_access_codes') || '[]';
          let codes = JSON.parse(codesStr);

          const codeStr = Math.random().toString(36).substring(2, 8).toUpperCase();
          const newCode = {
            id: Date.now().toString(),
            resourceId: reqData.resourceId,
            resourceName: reqData.resourceName || 'N/A',
            email: reqData.email,
            code: codeStr,
            createdAt: Date.now(),
            expiresAt: durationDays > 0 ? Date.now() + durationDays * 86400000 : null,
            maxUses: maxUses || null,
            usedCount: 0,
            encryptedDriveLink: driveLink ? xorEncrypt(driveLink, ENCRYPT_KEY) : null
          };
          codes.push(newCode);
          await env.UNIFOLIO_USERS.put('drive_access_codes', JSON.stringify(codes));

          reqs[reqIndex].status = 'approved';
          reqs[reqIndex].processedAt = Date.now();
          await env.UNIFOLIO_USERS.put('drive_access_requests', JSON.stringify(reqs));

          const GAS_URL = "https://script.google.com/macros/s/AKfycbzczlHzPEtPko7GC6g1gl1JTfXdglZI6MfTScjkW49LdZdFVYyRcZr7DqtmdYYohpBf1g/exec";
          const GAS_TOKEN = "unifolio-secret-999";
          const expireText = durationDays > 0 ? `${durationDays} ngày` : 'Vĩnh viễn';
          const usesText = maxUses > 0 ? `${maxUses} lần` : 'Không giới hạn';
          const clientOrigin = request.headers.get('Origin') || 'https://www.unifolio.io.vn';
          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #2563EB; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Truy Cập Tài Nguyên</h1>
              </div>
              <div style="padding: 24px; background-color: #f9fafb;">
                <p>Chào <strong>${reqData.name}</strong>,</p>
                <p>Yêu cầu truy cập tài nguyên của bạn đã được <strong>chấp nhận</strong>.</p>
                
                <div style="background-color: white; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0;"><strong>Tài nguyên:</strong> <a href="${clientOrigin}/asset/${reqData.resourceId}" style="color: #2563EB; text-decoration: none; font-weight: bold;">${reqData.resourceName}</a></p>
                  <p style="margin: 0 0 10px 0;"><strong>Mã bảo vệ:</strong> <span style="background: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; font-size: 18px;">${codeStr}</span></p>
                  <p style="margin: 0 0 10px 0;"><strong>Thời hạn:</strong> ${expireText}</p>
                  <p style="margin: 0;"><strong>Số lượt dùng:</strong> ${usesText}</p>
                </div>
                
                <p>Hãy <a href="${clientOrigin}/asset/${reqData.resourceId}" style="color: #2563EB; font-weight: bold; text-decoration: underline;">bấm vào đây</a> để truy cập tài nguyên, sử dụng email <strong>${reqData.email}</strong> và Mã bảo vệ trên để mở khoá nhé.</p>
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Trân trọng,<br>Unifolio Team</p>
              </div>
            </div>
          `;

          try {
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                token: GAS_TOKEN,
                toAddress: reqData.email,
                subject: `[Unifolio] Mã bảo vệ tài nguyên: ${reqData.resourceName}`,
                htmlBody: htmlBody
              })
            });
          } catch(e) { console.error(e); }

          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // POST: reject access request
        if (url.pathname === '/api/drive-access/requests/reject' && request.method === 'POST') {
          const { id } = await request.json();
          const reqsStr = await env.UNIFOLIO_USERS.get('drive_access_requests') || '[]';
          let reqs = JSON.parse(reqsStr);
          const reqIndex = reqs.findIndex(r => r.id === id);
          if (reqIndex === -1) return new Response('Not found', { status: 404, headers: corsHeaders });
          const reqData = reqs[reqIndex];
          
          reqs[reqIndex].status = 'rejected';
          reqs[reqIndex].processedAt = Date.now();
          await env.UNIFOLIO_USERS.put('drive_access_requests', JSON.stringify(reqs));

          const GAS_URL = "https://script.google.com/macros/s/AKfycbzczlHzPEtPko7GC6g1gl1JTfXdglZI6MfTScjkW49LdZdFVYyRcZr7DqtmdYYohpBf1g/exec";
          const GAS_TOKEN = "unifolio-secret-999";
          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #EF4444; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Từ Chối Cấp Quyền</h1>
              </div>
              <div style="padding: 24px; background-color: #f9fafb;">
                <p>Chào <strong>${reqData.name}</strong>,</p>
                <p>Yêu cầu truy cập tài nguyên <strong>${reqData.resourceName}</strong> của bạn đã bị từ chối.</p>
                <p>Lý do có thể là thông tin bạn cung cấp chưa đủ để Unifolio phê duyệt, hoặc tài nguyên này hiện đang bị hạn chế.</p>
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Trân trọng,<br>Unifolio Team</p>
              </div>
            </div>
          `;

          try {
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                token: GAS_TOKEN,
                toAddress: reqData.email,
                subject: `[Unifolio] Yêu cầu truy cập bị từ chối: ${reqData.resourceName}`,
                htmlBody: htmlBody
              })
            });
          } catch(e) { console.error(e); }

          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // GET: list all codes
        if (url.pathname === '/api/drive-access' && request.method === 'GET') {
          const codesStr = await env.UNIFOLIO_USERS.get('drive_access_codes') || '[]';
          return new Response(codesStr, { headers: corsHeaders });
        }

        // GET: access logs
        if (url.pathname === '/api/drive-access/logs' && request.method === 'GET') {
          const logStr = await env.UNIFOLIO_USERS.get('drive_access_log') || '[]';
          return new Response(logStr, { headers: corsHeaders });
        }
        
        // POST: decrypt assets array for Admin UI
        if (url.pathname === '/api/drive-access/decrypt-assets' && request.method === 'POST') {
          const items = await request.json();
          const ENCRYPT_KEY = env.DRIVE_ENCRYPT_KEY || 'unifolio-default-key-2024';
          const decrypted = items.map(item => {
            if (item.driveLink && item.driveLink.startsWith('ENC:')) {
              return { ...item, driveLink: xorDecrypt(item.driveLink.replace('ENC:', ''), ENCRYPT_KEY) };
            }
            return item;
          });
          return new Response(JSON.stringify(decrypted), { headers: corsHeaders });
        }

        // POST: generate new code
        if (url.pathname === '/api/drive-access/generate' && request.method === 'POST') {
          const body = await request.json();
          const { resourceId, email, durationDays, code, resourceName, driveLink, maxUses } = body;
          const ENCRYPT_KEY = env.DRIVE_ENCRYPT_KEY || 'unifolio-default-key-2024';

          const codesStr = await env.UNIFOLIO_USERS.get('drive_access_codes') || '[]';
          let codes = JSON.parse(codesStr);

          const newCode = {
            id: Date.now().toString(),
            resourceId,
            resourceName: resourceName || 'N/A',
            email,
            code: code || Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: Date.now(),
            expiresAt: durationDays > 0 ? Date.now() + durationDays * 86400000 : null,
            maxUses: maxUses || null,
            usedCount: 0,
            encryptedDriveLink: driveLink ? xorEncrypt(driveLink, ENCRYPT_KEY) : null
          };

          codes.push(newCode);
          await env.UNIFOLIO_USERS.put('drive_access_codes', JSON.stringify(codes));

          // Return codes but strip encrypted link for safety
          const safeCodes = codes.map(c => {
            const { encryptedDriveLink, ...rest } = c;
            return { ...rest, hasDriveLink: !!encryptedDriveLink };
          });
          return new Response(JSON.stringify(safeCodes), { headers: corsHeaders });
        }

        // DELETE: revoke a code
        if (request.method === 'DELETE') {
          const id = url.pathname.split('/').pop();
          const codesStr = await env.UNIFOLIO_USERS.get('drive_access_codes') || '[]';
          let codes = JSON.parse(codesStr);
          codes = codes.filter(c => c.id !== id);
          await env.UNIFOLIO_USERS.put('drive_access_codes', JSON.stringify(codes));
          const safeCodes = codes.map(c => {
            const { encryptedDriveLink, ...rest } = c;
            return { ...rest, hasDriveLink: !!encryptedDriveLink };
          });
          return new Response(JSON.stringify(safeCodes), { headers: corsHeaders });
        }
      }

      if (url.pathname === '/api/content') {
        const pathParam = url.searchParams.get('path');
        
        if (request.method === 'GET') {
          const githubUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${pathParam}`;
          const res = await fetch(githubUrl, {
            headers: {
              'User-Agent': 'Unifolio-Worker',
              'Authorization': `token ${env.GITHUB_TOKEN}`
            }
          });
          const data = await res.json();
          return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const { username, password, path, content, message, sha, branch } = body;

          const user = await verifyAuth(env, username, password);
          if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

          const moduleKey = MODULE_MAP[path];
          const isImageUpload = path.startsWith('public/images/') || path.startsWith('public/assets/');
          
          if (!moduleKey && !isImageUpload) {
            if (user.role !== 'SUPERADMIN') {
               return new Response(JSON.stringify({ error: 'Forbidden Path' }), { status: 403, headers: corsHeaders });
            }
          }

          if (user.role !== 'SUPERADMIN' && moduleKey) {
            const perms = user.permissions[moduleKey];
            if (!perms || !perms.view) {
              return new Response(JSON.stringify({ error: `Forbidden: Không có quyền xem danh mục này` }), { status: 403, headers: corsHeaders });
            }

            try {
              let incomingArray;
              try {
                const b64Decoded = atob(content);
                const utf8Str = decodeURIComponent(escape(b64Decoded));
                incomingArray = JSON.parse(utf8Str);
              } catch (e) {
                incomingArray = JSON.parse(atob(content));
              }

              const existingRaw = await fetchFromGithub(env, path);
              const existingArray = existingRaw ? JSON.parse(existingRaw) : [];

              const existingMap = new Map(existingArray.map(i => [i.id, i]));
              const incomingMap = new Map(incomingArray.map(i => [i.id, i]));

              for (const exItem of existingArray) {
                if (!incomingMap.has(exItem.id)) {
                  if (perms.delete === 'NONE') throw new Error('Không có quyền XÓA bài viết.');
                  if (perms.delete === 'OWN' && exItem.userCreate !== username) throw new Error(`Không thể xóa bài viết không phải của bạn: ${exItem.name}`);
                }
              }

              for (const inItem of incomingArray) {
                const exItem = existingMap.get(inItem.id);
                if (!exItem) {
                  if (!perms.add) throw new Error('Không có quyền THÊM MỚI.');
                  inItem.userCreate = username; 
                } else {
                  if (JSON.stringify(exItem) !== JSON.stringify(inItem)) {
                    if (perms.edit === 'NONE') throw new Error('Không có quyền CHỈNH SỬA.');
                    if (perms.edit === 'OWN' && exItem.userCreate !== username) throw new Error(`Không thể chỉnh sửa bài viết không phải của bạn: ${exItem.name}`);
                    if (perms.edit === 'OWN') {
                      inItem.userCreate = exItem.userCreate;
                    }
                  }
                }
                
                // --- Encrypt driveLink if saving unity-assets.json ---
                if (path === 'public/data/unity-assets.json' && inItem.driveLink && !inItem.driveLink.startsWith('ENC:')) {
                  const ENCRYPT_KEY = env.DRIVE_ENCRYPT_KEY || 'unifolio-default-key-2024';
                  inItem.driveLink = 'ENC:' + xorEncrypt(inItem.driveLink, ENCRYPT_KEY);
                }
              }

              const newUtf8Str = unescape(encodeURIComponent(JSON.stringify(incomingArray, null, 2)));
              body.content = btoa(newUtf8Str);
            } catch (err) {
              return new Response(JSON.stringify({ error: err.message }), { status: 403, headers: corsHeaders });
            }
          }

          const githubUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
          const res = await fetch(githubUrl, {
            method: 'PUT',
            headers: {
              'User-Agent': 'Unifolio-Worker',
              'Authorization': `token ${env.GITHUB_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message,
              content: body.content,
              sha,
              branch: branch || 'main'
            })
          });

          const data = await res.json();
          return new Response(JSON.stringify(data), { status: res.status, headers: corsHeaders });
        }
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
