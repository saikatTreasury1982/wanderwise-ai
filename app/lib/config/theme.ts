export const THEMES = [
  {
    key: 'aurora-dreams',
    label: 'Aurora Dreams',
    description: 'Indigo, navy and violet',
    swatch: ['#1a1a2e', '#0f3460', '#A855F7'],
  },
  {
    key: 'midnight-ocean',
    label: 'Midnight Ocean',
    description: 'Deep navy and teal',
    swatch: ['#0B1B2B', '#103449', '#1D9E75'],
  },
  {
    key: 'warm-sunset',
    label: 'Warm Sunset',
    description: 'Plum and burnt orange',
    swatch: ['#241A22', '#4A2733', '#D85A30'],
  },
  {
    key: 'forest-expedition',
    label: 'Forest Expedition',
    description: 'Pine, moss and gold',
    swatch: ['#12211C', '#1D3A28', '#B07C18'],
  },
  {
    key: 'coastal-depths',
    label: 'Coastal Depths',
    description: 'Slate teal and warm sand',
    swatch: ['#17262B', '#2A4348', '#2E8783'],
  },
  {
    key: 'classic-light',
    label: 'Classic Light',
    description: 'Clean light with soft green',
    swatch: ['#F7FAF9', '#E1EDEA', '#1D9E75'],
  },
] as const;

export type ThemeKey = (typeof THEMES)[number]['key'];

export const DEFAULT_THEME: ThemeKey = 'aurora-dreams';

export const THEME_KEYS = THEMES.map((t) => t.key) as readonly ThemeKey[];

export function isValidTheme(value: unknown): value is ThemeKey {
  return typeof value === 'string' && (THEME_KEYS as readonly string[]).includes(value);
}

export function getTheme(key: string | null | undefined) {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}

/* Semantic colours — identical across all themes, safe to use in JS */
export const semantic = {
  success: { light: '#6EE7B7', main: '#10B981', dark: '#059669' },
  warning: { light: '#FCD34D', main: '#F59E0B', dark: '#D97706' },
  error:   { light: '#FCA5A5', main: '#EF4444', dark: '#DC2626' },
} as const;

/* Read the active theme's primary ramp at runtime.
   Use for chart libraries, SVG fills, inline styles — anywhere
   a Tailwind class won't work. Returns Aurora Dreams on the server. */
export function getPrimaryColor(
  stop: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  const fallback = '#A855F7';
  if (typeof window === 'undefined') return fallback;
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--p${stop}`)
      .trim() || fallback
  );
}