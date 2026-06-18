import { createContext, useContext, useState, useMemo, useEffect } from 'react';
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
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#6366F1',
            light: '#818CF8',
            dark: '#4F46E5',
          },
          secondary: {
            main: '#EC4899',
            light: '#F472B6',
            dark: '#DB2777',
          },
          background: {
            default: mode === 'light' ? '#F8FAFC' : '#0F172A',
            paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
          },
          text: {
            primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
            secondary: mode === 'light' ? '#64748B' : '#94A3B8',
          },
          divider: mode === 'light' ? '#E2E8F0' : '#334155',
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
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 6px rgba(0,0,0,0.3)',
                borderRadius: 16,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 6px rgba(0,0,0,0.3)',
                borderRadius: 16,
                border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
                backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E293B',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 10,
                  '& fieldset': {
                    borderColor: mode === 'light' ? '#E2E8F0' : '#475569',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'light' ? '#CBD5E1' : '#64748B',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366F1',
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
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 20,
                border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
                backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E293B',
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
      }),
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
