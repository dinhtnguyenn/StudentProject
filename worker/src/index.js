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

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);

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
                // Handle base64 from btoa -> unescape -> encodeURIComponent which is utf8 safe
                const b64Decoded = atob(content);
                const utf8Str = decodeURIComponent(escape(b64Decoded));
                incomingArray = JSON.parse(utf8Str);
              } catch (e) {
                // fallback standard json parse if not base64
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
