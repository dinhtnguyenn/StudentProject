const fs = require('fs');
const path = require('path');

const cardPath = path.join(__dirname, '../src/components/ProjectCard.tsx');
let cardContent = fs.readFileSync(cardPath, 'utf-8');

cardContent = cardContent.replace(
  'interface Props {\n  project: Project;\n  categoryColors?: Record<string, { bg: string; text: string }>;\n}',
  'interface Props {\n  project: Project;\n  allProjects?: Project[];\n  categoryColors?: Record<string, { bg: string; text: string }>;\n}'
);

cardContent = cardContent.replace(
  'export default function ProjectCard({ project, categoryColors = {} }: Props) {',
  'export default function ProjectCard({ project, allProjects = [], categoryColors = {} }: Props) {'
);

cardContent = cardContent.replace(
  '<ProjectDetailModal\n        project={project}\n        open={openDetail}\n        onClose={() => setOpenDetail(false)}\n        onShare={handleShare}\n      />',
  '<ProjectDetailModal\n        project={project}\n        allProjects={allProjects}\n        open={openDetail}\n        onClose={() => setOpenDetail(false)}\n        onShare={handleShare}\n      />'
);

fs.writeFileSync(cardPath, cardContent);

const galleryPath = path.join(__dirname, '../src/components/ProjectGallery.tsx');
let galleryContent = fs.readFileSync(galleryPath, 'utf-8');

galleryContent = galleryContent.replace(
  '<ProjectCard project={project} categoryColors={categoryColors} />',
  '<ProjectCard project={project} allProjects={projects} categoryColors={categoryColors} />'
);

galleryContent = galleryContent.replace(
  '<ProjectDetailModal \n          project={sharedProject}\n          open={true}\n          onClose={closeSharedProject}\n        />',
  '<ProjectDetailModal \n          project={sharedProject}\n          allProjects={projects}\n          open={true}\n          onClose={closeSharedProject}\n        />'
);

fs.writeFileSync(galleryPath, galleryContent);
console.log("Done");
