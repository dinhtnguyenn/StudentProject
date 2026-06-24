import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const DATA_DIR = path.join(__dirname, '../public/data');
const DOMAIN = 'https://www.unifolio.io.vn';

function generateSeoPages() {
  try {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log('No dist/index.html found. Skipping SEO generation.');
      return;
    }

    const templateHtml = fs.readFileSync(indexPath, 'utf8');

    // Projects
    const projectsPath = path.join(DATA_DIR, 'projects.json');
    if (fs.existsSync(projectsPath)) {
      const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
      projects.forEach(project => {
        if (project.id) {
          createSeoHtml(templateHtml, 'project', project.id, project.name, project.description, project.thumbnail);
        }
      });
    }

    // Articles
    const articlesPath = path.join(DATA_DIR, 'articles.json');
    if (fs.existsSync(articlesPath)) {
      const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
      articles.forEach(article => {
        if (article.id) {
          createSeoHtml(templateHtml, 'article', article.id, article.title, `Bài viết: ${article.title} thuộc chuyên ngành ${article.major}`, article.imageUrl);
        }
      });
    }

    console.log('SEO pages generated successfully!');
  } catch (error) {
    console.error('Error generating SEO pages:', error);
  }
}

function createSeoHtml(template, type, id, title, description, imageUrl) {
  // Clean inputs
  const safeTitle = (title || 'UniFolio').replace(/"/g, '&quot;');
  const safeDesc = (description || 'Nơi tôn vinh và lan tỏa những giá trị tri thức từ các dự án xuất sắc của sinh viên.').replace(/"/g, '&quot;');
  const safeImage = imageUrl || `${DOMAIN}/logo.svg`;
  const pageUrl = `${DOMAIN}/${type}/${id}`;

  let html = template;
  
  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${safeTitle} | UniFolio</title>`);
  
  // Replace Meta Description
  html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${safeDesc}" />`);
  
  // Replace Canonical
  html = html.replace(/<link rel="canonical" href=".*?"\s*\/>/, `<link rel="canonical" href="${pageUrl}" />`);
  
  // Replace Open Graph
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${safeTitle} | UniFolio" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${safeImage}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${pageUrl}" />`);

  // Replace Twitter
  html = html.replace(/<meta property="twitter:title" content=".*?"\s*\/>/, `<meta property="twitter:title" content="${safeTitle} | UniFolio" />`);
  html = html.replace(/<meta property="twitter:description" content=".*?"\s*\/>/, `<meta property="twitter:description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="twitter:image" content=".*?"\s*\/>/, `<meta property="twitter:image" content="${safeImage}" />`);
  html = html.replace(/<meta property="twitter:url" content=".*?"\s*\/>/, `<meta property="twitter:url" content="${pageUrl}" />`);

  // Create directory
  const targetDir = path.join(DIST_DIR, type, id.toString());
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(path.join(targetDir, 'index.html'), html);
}

generateSeoPages();
