const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/ProjectDetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  'export default function ProjectDetailModal({ project, open, onClose, onShare }: Props) {',
  `export default function ProjectDetailModal({ project, allProjects = [], open, onClose, onShare }: Props) {
  const [activeProject, setActiveProject] = React.useState(project);
  React.useEffect(() => { setActiveProject(project); }, [project]);
`
);

content = content.replace('interface Props {', 'import React from "react";\ninterface Props {');
content = content.replace(
  '  project: Project;\n  open: boolean;',
  '  project: Project;\n  allProjects?: Project[];\n  open: boolean;'
);

const parts = content.split('const muiTheme = useTheme();');
let body = parts[1];

body = body.replace(/\bproject\./g, 'activeProject.');

const relatedProjectsCode = `
            {relatedProjects.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  Có thể bạn cũng quan tâm
                </Typography>
                <Grid container spacing={2}>
                  {relatedProjects.map((rp: Project) => (
                    <Grid item xs={12} sm={4} key={rp.id}>
                      <Box 
                        onClick={() => setActiveProject(rp)}
                        sx={{ 
                          p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                          bgcolor: 'background.default', cursor: 'pointer',
                          transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)' }
                        }}
                      >
                        <Box sx={{ width: '100%', height: 100, borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                          <ImageWithFallback src={rp.imageUrls[0]} alt={rp.name} height={100} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {rp.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            <CommentSection`;

body = body.replace('<CommentSection', relatedProjectsCode);

const calcCode = `
  const relatedProjects = React.useMemo(() => {
    return allProjects
      .filter((p: Project) => p.id !== activeProject.id && (p.category === activeProject.category || p.major === activeProject.major))
      .slice(0, 3);
  }, [allProjects, activeProject]);

  return (`;

body = body.replace('return (', calcCode);

fs.writeFileSync(filePath, parts[0] + 'const muiTheme = useTheme();' + body);

console.log("Done");
