export const theme = {
  colors: {
    primary: {
      50: '#E0F2F7',
      100: '#B2E5F0',
      200: '#80D6E8',
      300: '#4DD0E1',
      400: '#26C6DA',
      500: '#00BCD4',
      600: '#00ACC1',
      700: '#0097A7',
      800: '#00838F',
      900: '#006064',
    },
    neutral: {
      50: '#FAFBFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    success: {
      light: '#6EE7B7',
      main: '#10B981',
      dark: '#059669',
    },
    warning: {
      light: '#FCD34D',
      main: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#FCA5A5',
      main: '#EF4444',
      dark: '#DC2626',
    },
  },
} as const;

export type Theme = typeof theme;