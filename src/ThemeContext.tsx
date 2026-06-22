import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { getCurrentSeason } from './lib/seasonalEngine';
import type { ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () => {
      const season = getCurrentSeason();
      const isOverride = season.id !== 'NONE';
      const activeMode = season.palette.modeOverride || mode;

      return createTheme({
        palette: {
          mode: activeMode,
          primary: {
            main: isOverride ? season.palette.primary : '#2563EB',
            light: isOverride ? season.palette.primary : '#60A5FA',
            dark: isOverride ? season.palette.primary : '#1D4ED8',
          },
          secondary: {
            main: isOverride ? season.palette.secondary : '#EC4899',
            light: isOverride ? season.palette.secondary : '#F472B6',
            dark: isOverride ? season.palette.secondary : '#DB2777',
          },
          background: {
            default: activeMode === 'light' ? '#F8FAFC' : '#0F172A',
            paper: activeMode === 'light' ? '#FFFFFF' : '#1E293B',
          },
          text: {
            primary: activeMode === 'light' ? '#0F172A' : '#F8FAFC',
            secondary: activeMode === 'light' ? '#64748B' : '#94A3B8',
          },
          divider: activeMode === 'light' ? '#E2E8F0' : '#334155',
        },
        typography: {
          fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", system-ui, sans-serif',
          h1: { fontWeight: 800, letterSpacing: '-0.025em' },
          h2: { fontWeight: 800, letterSpacing: '-0.025em' },
          h3: { fontWeight: 700, letterSpacing: '-0.02em' },
          h4: { fontWeight: 700, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700, letterSpacing: '-0.01em' },
          h6: { fontWeight: 600 },
          body1: { lineHeight: 1.7 },
          body2: { lineHeight: 1.6 },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 10,
                padding: '8px 20px',
                fontSize: '0.875rem',
              },
              contained: {
                boxShadow: 'none',
                background: isOverride
                  ? `linear-gradient(135deg, ${season.palette.primary} 0%, ${season.palette.secondary} 100%)`
                  : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                '&:hover': {
                  boxShadow: `0 4px 12px ${isOverride ? season.palette.primary : 'rgba(37, 99, 235, 0.3)'}40`,
                  background: isOverride
                    ? `linear-gradient(135deg, ${season.palette.secondary} 0%, ${season.palette.primary} 100%)`
                    : 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: activeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 6px rgba(0,0,0,0.3)',
                borderRadius: 16,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: activeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 6px rgba(0,0,0,0.3)',
                borderRadius: 16,
                border: `1px solid ${activeMode === 'light' ? '#E2E8F0' : '#334155'}`,
                backgroundColor: activeMode === 'light' ? '#FFFFFF' : '#1E293B',
                '&:hover': isOverride ? {
                  borderColor: season.palette.primary,
                  boxShadow: `0 8px 24px ${season.palette.primary}18`,
                } : {},
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 10,
                  '& fieldset': {
                    borderColor: activeMode === 'light' ? '#E2E8F0' : '#475569',
                  },
                  '&:hover fieldset': {
                    borderColor: isOverride ? season.palette.primary : (activeMode === 'light' ? '#CBD5E1' : '#64748B'),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: isOverride ? season.palette.primary : '#2563EB',
                    borderWidth: 2,
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                borderRadius: 8,
              },
              filled: isOverride ? {
                '&.MuiChip-colorPrimary': {
                  background: `linear-gradient(135deg, ${season.palette.primary}, ${season.palette.secondary})`,
                  color: '#FFF',
                },
              } : {},
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 20,
                border: `1px solid ${activeMode === 'light' ? '#E2E8F0' : '#334155'}`,
                backgroundColor: activeMode === 'light' ? '#FFFFFF' : '#1E293B',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minWidth: 'auto',
                padding: '8px 16px',
              },
            },
          },
        },
      });
    },
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
