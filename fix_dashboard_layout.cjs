const fs = require('fs');

let content = fs.readFileSync('src/components/AdminForm.tsx', 'utf-8');

const oldSection = `                {/* 2. Detailed Distribution Sections */}
                <Grid container spacing={3}>
                  {/* Left Column: Projects & Articles by Major */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><SchoolIcon color="primary" /> Phân Bổ Theo Chuyên Ngành</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', minHeight: 300 }}>
                      {majorsList.length === 0 ? (
                        <Typography color="text.secondary">Chưa có dữ liệu chuyên ngành.</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {majorsList.map(major => {
                            const pCount = projectsList.filter(p => p.major === major.id).length;
                            const aCount = articlesList.filter(a => a.major === major.id).length;
                            const totalItems = projectsList.length + articlesList.length;
                            const pPercentage = totalItems > 0 ? (pCount / totalItems) * 100 : 0;
                            const aPercentage = totalItems > 0 ? (aCount / totalItems) * 100 : 0;
                            return (
                              <Box key={major.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>{major.name}</Typography>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.secondary' }}>Dự án: {pCount} | Bài viết: {aCount}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', height: 12, borderRadius: 10, overflow: 'hidden', bgcolor: 'action.hover' }}>
                                  <Box sx={{ width: \`\${pPercentage}%\`, bgcolor: major.bg !== 'transparent' ? major.bg : 'primary.main', transition: 'width 1s ease-in-out' }} />
                                  <Box sx={{ width: \`\${aPercentage}%\`, bgcolor: major.text !== 'transparent' ? major.text : 'secondary.main', transition: 'width 1s ease-in-out', opacity: 0.7 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Right Column: Other Categorizations */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      
                      {/* Categories for Projects */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><CategoryIcon color="info" /> Phân Loại Dự Án</Typography>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                          {categoriesList.length === 0 ? <Typography color="text.secondary">Chưa có phân loại dự án.</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {categoriesList.map(cat => {
                                const count = projectsList.filter(p => p.category === cat.id).length;
                                const percentage = projectsList.length > 0 ? (count / projectsList.length) * 100 : 0;
                                return (
                                  <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography sx={{ width: 120, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{cat.name}</Typography>
                                    <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                      <Box sx={{ width: \`\${percentage}%\`, height: '100%', bgcolor: cat.bg !== 'transparent' ? cat.bg : 'info.main', transition: 'width 1s ease-in-out' }} />
                                    </Box>
                                    <Typography sx={{ width: 30, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Paper>
                      </Box>

                      {/* Types for Articles */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><ArticleIcon color="secondary" /> Loại Hình Bài Viết</Typography>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                          {articleTypesList.length === 0 ? <Typography color="text.secondary">Chưa có loại bài viết.</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {articleTypesList.map(type => {
                                const count = articlesList.filter(a => a.type === type.id).length;
                                const percentage = articlesList.length > 0 ? (count / articlesList.length) * 100 : 0;
                                return (
                                  <Box key={type.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography sx={{ width: 120, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{type.name}</Typography>
                                    <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                      <Box sx={{ width: \`\${percentage}%\`, height: '100%', bgcolor: type.bg !== 'transparent' ? type.bg : 'secondary.main', transition: 'width 1s ease-in-out' }} />
                                    </Box>
                                    <Typography sx={{ width: 30, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Paper>
                      </Box>

                      {/* Unity Assets Sources & Types */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><StorageIcon color="success" /> Cơ Cấu Tài Nguyên</Typography>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Nguồn</Typography>
                              {assetSourcesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  {assetSourcesList.map(src => {
                                    const count = unityAssetsList.filter(a => a.sourceId === src.id).length;
                                    return (
                                      <Box key={src.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{src.name}</Typography>
                                        <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: 'action.selected' }} />
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )}
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Loại</Typography>
                              {assetTypesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  {assetTypesList.map(type => {
                                    const count = unityAssetsList.filter(a => a.assetType === type.id).length;
                                    return (
                                      <Box key={type.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: type.text }}>{type.name}</Typography>
                                        <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: type.bg, color: type.text }} />
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      </Box>

                    </Box>
                  </Grid>
                </Grid>`;

const newSection = `                {/* 2. Detailed Distribution Sections */}
                <Grid container spacing={3}>
                  {/* Row 1: Phân Bổ Theo Chuyên Ngành (Full width grid) */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><SchoolIcon color="primary" /> Phân Bổ Theo Chuyên Ngành</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                      {majorsList.length === 0 ? (
                        <Typography color="text.secondary">Chưa có dữ liệu chuyên ngành.</Typography>
                      ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
                          {majorsList.map(major => {
                            const pCount = projectsList.filter(p => p.major === major.id).length;
                            const aCount = articlesList.filter(a => a.major === major.id).length;
                            const totalItems = projectsList.length + articlesList.length;
                            const pPercentage = totalItems > 0 ? (pCount / totalItems) * 100 : 0;
                            const aPercentage = totalItems > 0 ? (aCount / totalItems) * 100 : 0;
                            return (
                              <Box key={major.id} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>{major.name}</Typography>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.secondary' }}>Dự án: {pCount} | Bài viết: {aCount}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', height: 12, borderRadius: 10, overflow: 'hidden', bgcolor: 'action.hover' }}>
                                  <Box sx={{ width: \`\${pPercentage}%\`, bgcolor: major.bg !== 'transparent' ? major.bg : 'primary.main', transition: 'width 1s ease-in-out' }} />
                                  <Box sx={{ width: \`\${aPercentage}%\`, bgcolor: major.text !== 'transparent' ? major.text : 'secondary.main', transition: 'width 1s ease-in-out', opacity: 0.7 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Row 2: 3 Other Categorizations */}
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><CategoryIcon color="info" /> Phân Loại Dự Án</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      {categoriesList.length === 0 ? <Typography color="text.secondary">Chưa có phân loại dự án.</Typography> : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {categoriesList.map(cat => {
                            const count = projectsList.filter(p => p.category === cat.id).length;
                            const percentage = projectsList.length > 0 ? (count / projectsList.length) * 100 : 0;
                            return (
                              <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 100, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{cat.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: \`\${percentage}%\`, height: '100%', bgcolor: cat.bg !== 'transparent' ? cat.bg : 'info.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 24, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><ArticleIcon color="secondary" /> Loại Bài Viết</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      {articleTypesList.length === 0 ? <Typography color="text.secondary">Chưa có loại bài viết.</Typography> : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {articleTypesList.map(type => {
                            const count = articlesList.filter(a => a.type === type.id).length;
                            const percentage = articlesList.length > 0 ? (count / articlesList.length) * 100 : 0;
                            return (
                              <Box key={type.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ width: 100, fontWeight: 600, fontSize: '0.85rem' }} noWrap>{type.name}</Typography>
                                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 10, overflow: 'hidden' }}>
                                  <Box sx={{ width: \`\${percentage}%\`, height: '100%', bgcolor: type.bg !== 'transparent' ? type.bg : 'secondary.main', transition: 'width 1s ease-in-out' }} />
                                </Box>
                                <Typography sx={{ width: 24, textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>{count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}><StorageIcon color="success" /> Cơ Cấu Tài Nguyên</Typography>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Nguồn</Typography>
                          {assetSourcesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {assetSourcesList.map(src => {
                                const count = unityAssetsList.filter(a => a.sourceId === src.id).length;
                                return (
                                  <Box key={src.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{src.name}</Typography>
                                    <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: 'action.selected' }} />
                                  </Box>
                                )
                              })}
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>Theo Loại</Typography>
                          {assetTypesList.length === 0 ? <Typography variant="body2" color="text.disabled">Trống</Typography> : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {assetTypesList.map(type => {
                                const count = unityAssetsList.filter(a => a.assetType === type.id).length;
                                return (
                                  <Box key={type.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: type.text }}>{type.name}</Typography>
                                    <Chip label={count} size="small" sx={{ fontWeight: 800, bgcolor: type.bg, color: type.text }} />
                                  </Box>
                                )
                              })}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>`;

if (content.includes("Phân Bổ Theo Chuyên Ngành")) {
  content = content.replace(oldSection, newSection);
  fs.writeFileSync('src/components/AdminForm.tsx', content, 'utf-8');
  console.log("Replaced successfully!");
} else {
  console.log("Could not find TargetContent!");
}
