import re

with open('src/components/AdminForm.tsx', 'r') as f:
    content = f.read()

# Generate Tab 14 UI
tab14_ui = """
            {/* Tab 14: Mã Bảo Vệ Drive */}
            {tabIndex === 14 && (
              <Box>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản Lý Mã Bảo Vệ Drive</Typography>
                  <Button variant="contained" onClick={fetchDriveCodes} disabled={loadingCodes} startIcon={loadingCodes ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}>Làm Mới</Button>
                </Box>
                
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Cấp mã mới</Typography>
                  <form onSubmit={handleGenerateCode}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          options={[...projectsList, ...unityAssetsList]}
                          getOptionLabel={(option) => `[${option.isGoldenTicket !== undefined ? 'Dự án' : 'Tài nguyên'}] ${option.name}`}
                          onChange={(e, val) => setCodeFormData({...codeFormData, resourceId: val ? val.id : ''})}
                          renderInput={(params) => <TextField {...params} label="Chọn tài nguyên" required />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Email người nhận" type="email" value={codeFormData.email} onChange={e => setCodeFormData({...codeFormData, email: e.target.value})} required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                          <InputLabel>Thời hạn</InputLabel>
                          <Select value={codeFormData.durationDays} label="Thời hạn" onChange={e => setCodeFormData({...codeFormData, durationDays: Number(e.target.value)})}>
                            <MenuItem value={1}>24 giờ (1 ngày)</MenuItem>
                            <MenuItem value={2}>48 giờ (2 ngày)</MenuItem>
                            <MenuItem value={3}>3 ngày</MenuItem>
                            <MenuItem value={7}>7 ngày</MenuItem>
                            <MenuItem value={30}>30 ngày</MenuItem>
                            <MenuItem value={0}>Vĩnh viễn (0)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained" color="primary" sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700 }}>Tạo Mã Bảo Vệ</Button>
                      </Grid>
                    </Grid>
                  </form>
                </Paper>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Tài Nguyên</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Mã Bảo Vệ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Hết Hạn</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingCodes ? (
                         <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                      ) : driveAccessCodes.length === 0 ? (
                         <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có mã bảo vệ nào.</TableCell></TableRow>
                      ) : (
                        driveAccessCodes.map((codeItem) => (
                          <TableRow key={codeItem.id}>
                            <TableCell><Typography variant="body2" fontWeight={600}>{codeItem.resourceName}</Typography><Typography variant="caption" color="text.secondary">ID: {codeItem.resourceId}</Typography></TableCell>
                            <TableCell>{codeItem.email}</TableCell>
                            <TableCell><Chip label={codeItem.code} color="primary" variant="outlined" size="small" sx={{ fontWeight: 800, letterSpacing: 1 }} /></TableCell>
                            <TableCell>
                              {codeItem.expiresAt ? (
                                <Typography variant="body2" color={Date.now() > codeItem.expiresAt ? 'error' : 'text.primary'}>
                                  {new Date(codeItem.expiresAt).toLocaleString('vi-VN')} {Date.now() > codeItem.expiresAt && '(Đã hết hạn)'}
                                </Typography>
                              ) : <Typography variant="body2" color="success.main">Vĩnh viễn</Typography>}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => handleDeleteCode(codeItem.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
"""

content = content.replace("          </Grid>\n        </Box>\n      )}", "          </Grid>\n        </Box>\n      )}\n" + tab14_ui)

with open('src/components/AdminForm.tsx', 'w') as f:
    f.write(content)
