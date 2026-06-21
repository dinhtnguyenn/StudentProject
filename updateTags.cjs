const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'public', 'data', 'projects.json');
const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

const GAME_MAJOR_ID = "1781836769312";
const MOBILE_MAJOR_ID = "1781836774661";

let updatedCount = 0;

projectsData.forEach(p => {
  if (!p.techTags) {
    p.techTags = [];
  }
  
  if (p.major === GAME_MAJOR_ID) {
    if (!p.techTags.includes("Unity")) {
      p.techTags.push("Unity");
      updatedCount++;
    }
  } else if (p.major === MOBILE_MAJOR_ID) {
    if (!p.techTags.includes("React Native")) {
      p.techTags.push("React Native");
      updatedCount++;
    }
  }
});

fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2), 'utf8');

console.log(`Updated ${updatedCount} projects.`);
