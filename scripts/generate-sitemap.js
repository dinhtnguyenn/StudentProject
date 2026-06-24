import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DOMAIN = 'https://www.unifolio.io.vn';

function generateSitemap() {
  try {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/articles</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Add Projects
    const projectsPath = path.join(PUBLIC_DIR, 'data/projects.json');
    if (fs.existsSync(projectsPath)) {
      const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
      projects.forEach(project => {
        if (project.id) {
          sitemap += `  <url>\n    <loc>${DOMAIN}/project/${project.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }
      });
    }

    // Add Articles
    const articlesPath = path.join(PUBLIC_DIR, 'data/articles.json');
    if (fs.existsSync(articlesPath)) {
      const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
      articles.forEach(article => {
        if (article.id) {
          sitemap += `  <url>\n    <loc>${DOMAIN}/article/${article.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }
      });
    }

    sitemap += `</urlset>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap();
