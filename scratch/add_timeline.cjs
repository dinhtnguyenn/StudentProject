const fs = require('fs');
const path = require('path');

const galleryPath = path.join(__dirname, '../src/components/ProjectGallery.tsx');
let galleryContent = fs.readFileSync(galleryPath, 'utf-8');

// Add imports
if (!galleryContent.includes('ViewModuleIcon')) {
  galleryContent = galleryContent.replace(
    "import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';",
    "import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';\nimport ViewModuleIcon from '@mui/icons-material/ViewModule';\nimport ViewStreamIcon from '@mui/icons-material/ViewStream';\nimport { IconButton } from '@mui/material';"
  );
}

// Add state
if (!galleryContent.includes("const [viewMode, setViewMode]")) {
  galleryContent = galleryContent.replace(
    "const [currentTab, setCurrentTab] = useState('All');",
    "const [currentTab, setCurrentTab] = useState('All');\n  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');"
  );
}

// Replace header
const oldHeader = `<Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Hiển thị {filteredProjects.length} dự án
        </Typography>
      </Box>`;

const newHeader = `<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Hiển thị {filteredProjects.length} dự án
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'grid' ? 'action.selected' : 'transparent' }}>
            <ViewModuleIcon />
          </IconButton>
          <IconButton onClick={() => setViewMode('timeline')} color={viewMode === 'timeline' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'timeline' ? 'action.selected' : 'transparent' }}>
            <ViewStreamIcon />
          </IconButton>
        </Box>
      </Box>`;

galleryContent = galleryContent.replace(oldHeader, newHeader);

// Replace Grid
const oldGrid = `<Grid container spacing={3}>
              <AnimatePresence>
                {displayedProjects.map(project => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                    <motion.div variants={itemVariants} style={{ height: '100%' }}>
                      <ProjectCard project={project} allProjects={projects} categoryColors={categoryColors} />
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>`;

const newGrid = `{viewMode === 'grid' ? (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {displayedProjects.map(project => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                      <motion.div variants={itemVariants} style={{ height: '100%' }}>
                        <ProjectCard project={project} allProjects={projects} categoryColors={categoryColors} />
                      </motion.div>
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            ) : (
              <Box sx={{ position: 'relative', pl: { xs: 2, md: 0 } }}>
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: { xs: 8, md: '50%' }, width: 2, bgcolor: 'divider', transform: { md: 'translateX(-50%)' } }} />
                <AnimatePresence>
                  {displayedProjects.map((project, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <motion.div key={project.id} variants={itemVariants} style={{ position: 'relative', marginBottom: '3rem' }}>
                        <Box sx={{
                          display: 'flex', 
                          flexDirection: { xs: 'column', md: isEven ? 'row-reverse' : 'row' },
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%'
                        }}>
                          <Box sx={{
                            position: 'absolute', left: { xs: -24, md: '50%' }, top: 24,
                            width: 16, height: 16, borderRadius: '50%',
                            bgcolor: project.isGoldenTicket ? '#F59E0B' : 'primary.main',
                            transform: { xs: 'none', md: 'translateX(-50%)' },
                            zIndex: 1, border: '4px solid', borderColor: 'background.paper'
                          }} />
                          
                          <Box sx={{ width: { xs: '100%', md: '45%' }, px: { xs: 2, md: 4 } }}>
                            <ProjectCard project={project} allProjects={projects} categoryColors={categoryColors} />
                          </Box>
                          
                          <Box sx={{ display: { xs: 'none', md: 'block' }, width: '45%' }} />
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Box>
            )}`;

galleryContent = galleryContent.replace(oldGrid, newGrid);

fs.writeFileSync(galleryPath, galleryContent);
console.log("Done");
