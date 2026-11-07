/** Paleta e medidas compartilhadas pela interface nativa (RNFM-07, RNFM-08). */

export const colors = {
  page: '#f6f4ef',
  surface: '#ffffff',
  ink: '#1c1b19',
  inkMuted: '#55524b',
  border: '#ddd8ce',
  controlBorder: '#8a8478',
  brand: '#f33633',
  accent: '#c42a22',
  accentInk: '#ffffff',
  ready: '#1d5b34',
  error: '#8c1d18',
  errorSurface: '#fbeae8',
  proSurface: '#fdf0d5',
  proInk: '#6b4a00',
  shadow: '#1c1b19',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Alvo de toque mínimo recomendado pelo RNFM-07. */
export const MIN_TOUCH_TARGET = 48;
