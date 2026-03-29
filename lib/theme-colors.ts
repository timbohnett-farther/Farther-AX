/**
 * Centralized theme color utility
 * Use this across all pages for consistent theming
 */

export const getThemeColors = (isDark: boolean) => ({
  // Text colors
  dark: isDark ? '#F8F4F0' : '#1a1a1a',           // Primary text
  white: isDark ? '#1a1a1a' : '#F8F4F0',          // Inverse text
  slate: isDark ? 'rgba(212,223,229,0.5)' : 'rgba(102,102,102,0.6)', // Secondary text
  cream: isDark ? '#F8F4F0' : '#405C6A',          // Heading text
  textSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,26,0.7)',

  // Background colors
  bg: isDark ? '#111111' : '#F8F4F0',             // Main background
  cardBg: isDark ? '#171f27' : '#FFFFFF',         // Card background
  cardBgAlt: isDark ? 'rgba(250,247,242,0.03)' : '#F9F9F9', // Alternate row

  // Border colors
  border: isDark ? 'rgba(212,223,229,0.08)' : 'rgba(224,224,224,0.4)',
  borderSubtle: isDark ? 'rgba(212,223,229,0.05)' : 'rgba(224,224,224,0.25)',
  borderStrong: isDark ? 'rgba(212,223,229,0.15)' : 'rgba(224,224,224,0.6)',

  // Brand colors
  teal: '#3B5A69',
  lightBlue: '#7CA4B4',

  // Status colors
  green: '#10b981',
  greenBg: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
  greenBorder: isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.25)',

  amber: '#f59e0b',
  amberBg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)',
  amberBorder: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',

  red: '#ef4444',
  redBg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
  redBorder: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',

  gold: '#fbbf24',
  goldBg: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.08)',

  purple: '#a78bfa',
  purpleBg: isDark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.1)',
  purpleBorder: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0.25)',

  // Table specific
  tableHeaderBg: isDark ? '#2f2f2f' : '#E8E8E8',
  cardBgHover: isDark ? 'rgba(29,118,130,0.06)' : 'rgba(78,112,130,0.08)',
});

export type ThemeColors = ReturnType<typeof getThemeColors>;

// Helper to get stage colors
export const getStageColors = (teal: string, gold: string): Record<string, string> => ({
  '2496931':   '#7fb3d8',
  '2496932':   '#6ba3cc',
  '2496934':   '#5793c0',
  '100409509': '#4383b4',
  '2496935':   '#2f73a8',
  '2496936':   gold,
  '100411705': teal,
});
