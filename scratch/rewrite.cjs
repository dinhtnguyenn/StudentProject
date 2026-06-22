const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/ProjectGallery.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. We want to find the start of the filter section
const filterStartStr = `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>`;
const filterStartIdx = code.indexOf(filterStartStr);

// 2. We want to find the end of the filter section
const filterEndStr = `</motion.div>\n\n      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>`;
const filterEndIdx = code.indexOf(filterEndStr);

// 3. We want to find the end of the projects grid section
const gridEndStr = `</AnimatePresence>\n        </>\n      )}`
// wait, looking at the code it is:
// `      ) : (\n        <>\n          <motion.div variants={containerVariants} initial="hidden" animate="show">\n            {viewMode === 'grid' ? (\n...`
// `          </motion.div>\n        </>\n      )}`

const gridEndMatch = `      )}

      {sharedProject && (`
const gridEndIdx = code.indexOf(gridEndMatch);

if (filterStartIdx === -1 || filterEndIdx === -1 || gridEndIdx === -1) {
    console.error("Could not find sections");
    console.log({ filterStartIdx, filterEndIdx, gridEndIdx });
    process.exit(1);
}

const newFilterSection = `
      <Grid container spacing={{ xs: 3, lg: 4 }} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 3 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <Box sx={{
              position: { md: 'sticky' },
              top: { md: 100 },
              zIndex: 10,
              background: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid', borderColor: 'divider', borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              p: { xs: 2.5, sm: 3 },
              display: 'flex', flexDirection: 'column', gap: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -1 }}>Khám phá</Typography>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm dự án..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                    '&:hover': { bgcolor: 'background.paper' },
                    transition: 'all 0.3s'
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                fullWidth
                variant={showOnlyGoldenTicket ? 'contained' : 'outlined'}
                onClick={() => setShowOnlyGoldenTicket(!showOnlyGoldenTicket)}
                startIcon={<WorkspacePremiumIcon />}
                sx={{
                  height: 40,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderWidth: '1.5px',
                  ...(showOnlyGoldenTicket
                    ? {
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFF',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      }
                    }
                    : {
                      borderColor: '#F59E0B',
                      color: '#F59E0B',
                      bgcolor: 'transparent',
                      '&:hover': {
                        borderColor: '#D97706',
                        bgcolor: 'rgba(245,158,11,0.08)',
                        borderWidth: '1.5px',
                      }
                    }),
                }}
              >
                Golden Ticket
              </Button>

              <Divider />

              {/* Categories */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>Danh mục</Typography>
                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ overflowX: 'auto', pb: { xs: 1, md: 0 }, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                  {categoryNames.map(cat => (
                    <Chip
                      key={cat}
                      label={\`\${cat === 'All' ? 'Tất cả' : cat} (\${getCategoryCount(cat)})\`}
                      onClick={() => setCurrentTab(cat)}
                      variant={currentTab === cat ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', height: 36, flexShrink: 0,
                        justifyContent: 'flex-start', px: 1, borderRadius: 2,
                        ...(currentTab === cat
                          ? {
                            bgcolor: 'primary.main',
                            color: '#FFF', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }
                          : {
                            borderColor: 'divider', color: 'text.secondary',
                            '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.hover' },
                          }),
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Filters Box */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Học kỳ</InputLabel>
                  <Select
                    value={currentSemester}
                    label="Học kỳ"
                    onChange={e => setCurrentSemester(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {semesters.map(sem => (
                      <MenuItem key={sem} value={sem}>{sem === 'All' ? 'Tất cả học kỳ' : sem} ({getSemesterCount(sem)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Chuyên ngành</InputLabel>
                  <Select
                    value={currentMajor}
                    label="Chuyên ngành"
                    onChange={e => setCurrentMajor(e.target.value)}
                    sx={{ 
                      borderRadius: 3, 
                      bgcolor: muiTheme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                      '&:hover': { bgcolor: 'background.paper' },
                      transition: 'all 0.3s'
                    }}
                  >
                    {majors.map(major => (
                      <MenuItem key={major} value={major}>{major === 'All' ? 'Tất cả chuyên ngành' : major} ({getMajorCount(major)})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {allTags.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Công nghệ</Typography>
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => setIsGraphOpen(true)} 
                      startIcon={<HubIcon fontSize="small" />}
                      sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem' }}
                    >
                      Sơ đồ
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {allTags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        sx={{
                          fontSize: '0.75rem',
                          ...(selectedTags.includes(tag) ? { bgcolor: 'primary.main', color: '#FFF' } : { borderColor: 'divider', color: 'text.secondary' })
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>`;

const newCode = code.substring(0, filterStartIdx) 
  + newFilterSection 
  + code.substring(filterEndIdx + 14, gridEndIdx + gridEndMatch.length)
  + "\n        </Grid>\n      </Grid>\n"
  + code.substring(gridEndIdx + gridEndMatch.length);

fs.writeFileSync(filePath, newCode);
console.log('Successfully updated ProjectGallery.tsx');
