import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Helper: extract YouTube video ID from various URL formats
const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Plugin: Fetch YouTube video info (title, thumbnail, description) server-side
const youtubeInfoPlugin = () => ({
  name: 'youtube-info-plugin',
  configureServer(server: any) {
    server.middlewares.use('/api/youtube-info', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end();
        return;
      }

      let body = '';
      req.on('data', (chunk: any) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { url } = JSON.parse(body);
          const videoId = extractYoutubeId(url);

          if (!videoId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Link YouTube không hợp lệ' }));
            return;
          }

          // 1) Fetch oEmbed for title (reliable, no API key)
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          let title = '';
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json() as Record<string, any>;
            title = oembedData.title || '';
          }

          // 2) High-res thumbnail
          const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

          // 3) Fetch YouTube page HTML to extract full description
          let description = '';
          let teamMembers: string[] = [];

          try {
            const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
              },
            });
            const html = await pageRes.text();

            // Extract description from ytInitialPlayerResponse
            const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s)
              || html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);

            if (playerMatch) {
              try {
                const playerData = JSON.parse(playerMatch[1]);
                description = playerData?.videoDetails?.shortDescription || '';
              } catch { /* ignore parse error */ }
            }

            // Fallback: extract from meta tag if ytInitialPlayerResponse failed
            if (!description) {
              const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*?)"\s*\/?>/i);
              if (metaMatch) {
                description = metaMatch[1]
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>');
              }
            }

            // Parse team members from description
            if (description) {
              teamMembers = parseTeamMembers(description);
            }
          } catch (fetchErr) {
            console.warn('Could not fetch YouTube page for description:', fetchErr);
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            title,
            thumbnail,
            description,
            teamMembers,
            videoId,
          }));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    });
  },
});

/**
 * Parse team members from YouTube video description.
 * Supports common formats:
 *   - "Thành viên: A, B, C"
 *   - "Team: A, B"
 *   - Bullet lists with "- Nguyễn Văn A" or "• Nguyễn Văn A"
 *   - Lines after headers like "THÀNH VIÊN", "NHÓM THỰC HIỆN", "TEAM"
 */
function parseTeamMembers(desc: string): string[] {
  const members: string[] = [];
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);

  // Pattern 1: "Thành viên: A, B, C" or "Team: A, B, C" (inline)
  const inlinePattern = /(?:th[àa]nh\s*vi[êe]n|team|nh[oó]m|members?)\s*[:：]\s*(.+)/i;
  for (const line of lines) {
    const match = line.match(inlinePattern);
    if (match) {
      const names = match[1].split(/[,;，、]/).map(n => n.trim()).filter(n => n.length > 1 && n.length < 50);
      if (names.length > 0) return names;
    }
  }

  // Pattern 2: Find a header line, then collect bullet/dash items below it
  const headerPattern = /^(?:th[àa]nh\s*vi[êe]n|team|nh[oó]m\s*th[ưự]c\s*hi[eệ]n|members?|sinh\s*vi[êe]n)/i;
  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i])) {
      // Collect subsequent bullet lines
      for (let j = i + 1; j < lines.length; j++) {
        const bulletMatch = lines[j].match(/^[\-\•\*\+▪→►]\s*(.+)/);
        if (bulletMatch) {
          const name = bulletMatch[1].replace(/\s*[-–—:：].*$/, '').trim();
          if (name.length > 1 && name.length < 50) members.push(name);
        } else if (lines[j].match(headerPattern) || lines[j] === '') {
          break;
        } else {
          // Could be a name without bullet
          const name = lines[j].replace(/^\d+[.)]\s*/, '').replace(/\s*[-–—:：].*$/, '').trim();
          if (name.length > 1 && name.length < 50 && !name.includes('http')) members.push(name);
        }
      }
      if (members.length > 0) return members;
    }
  }

  return members;
}

// Plugin: Save project JSON locally during dev
const saveProjectPlugin = () => ({
  name: 'save-project-plugin',
  configureServer(server: any) {
    server.middlewares.use('/api/save-project', (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString() });
        req.on('end', () => {
          try {
            const newProject = JSON.parse(body);
            newProject.id = Date.now().toString();
            
            const filePath = path.resolve(__dirname, 'public/data/projects.json');
            let data: any[] = [];
            if (fs.existsSync(filePath)) {
               data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
            data.push(newProject);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, project: newProject }));
          } catch (error: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  base: '/StudentProject/',
  plugins: [react(), youtubeInfoPlugin(), saveProjectPlugin()],
})
