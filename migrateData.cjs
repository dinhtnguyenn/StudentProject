const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public/data');

const loadJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
const saveJson = (file, data) => fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));

const categories = loadJson('categories.json');
const majors = loadJson('majors.json');
const articleTypes = loadJson('articleTypes.json');

const catMap = {};
categories.forEach(c => catMap[c.name.trim().toLowerCase()] = c.id);

const majorMap = {};
majors.forEach(m => majorMap[m.name.trim().toLowerCase()] = m.id);

const typeMap = {};
articleTypes.forEach(t => typeMap[t.name.trim().toLowerCase()] = t.id);

const projects = loadJson('projects.json');
projects.forEach(p => {
  if (p.category) {
    const key = p.category.trim().toLowerCase();
    if (catMap[key]) p.category = catMap[key];
  }
  if (p.major) {
    const key = p.major.trim().toLowerCase();
    if (majorMap[key]) p.major = majorMap[key];
  }
});
saveJson('projects.json', projects);

const articles = loadJson('articles.json');
articles.forEach(a => {
  if (a.type) {
    const key = a.type.trim().toLowerCase();
    if (typeMap[key]) a.type = typeMap[key];
  }
  if (a.major) {
    const key = a.major.trim().toLowerCase();
    if (majorMap[key]) a.major = majorMap[key];
  }
});
saveJson('articles.json', articles);

console.log('Migration completed successfully!');
