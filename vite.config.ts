import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to save JSON locally during dev
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
            // Append a unique ID
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
  plugins: [react(), saveProjectPlugin()],
})
