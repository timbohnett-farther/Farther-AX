/**
 * Farther AX Design Tokens — Unified Design System
 *
 * Single source of truth for all colors, typography, spacing, and theming.
 * Brand colors: Limestone (#F8F4F0), Steel Blue (#3B5A69), Granite Blue (#2C3B4E), Clay (#9F8E75)
 */

// ============================================================================
// CORE BRAND COLORS (Steel Blue & Limestone)
// ============================================================================

export const colors = {
  // Primary brand colors
  cream: '#F8F4F0',
  teal: '#3B5A69',
  tealDark: '#2C3B4E',
  tealLight: '#7CA4B4',

  // Neutrals
  charcoal: '#333333',
  white: '#ffffff',
  slate: '#3B5A69',
  ice: '#E3D3C5',

  // Background gradient stops (dark mode)
  bg600: '#354858',
  bg800: '#2C3B4E',
  bg900: '#1E2A38',

  // Surface colors (dark mode default)
  cardBg: 'rgba(44, 59, 78, 0.80)',
  border: 'rgba(248, 244, 240, 0.08)',
  borderSubtle: 'rgba(248, 244, 240, 0.05)',

  // Text colors (cream-based for dark mode)
  textPrimary: '#F8F4F0',
  textSecondary: 'rgba(248, 244, 240, 0.7)',
  textMuted: 'rgba(248, 244, 240, 0.5)',
  textTertiary: 'rgba(248, 244, 240, 0.35)',

  // Market colors
  bull: '#34d399',
  bullDark: '#10b981',
  bear: '#f87171',
  bearDark: '#ef4444',
  neutral: '#94a3b8',

  // Tier/wealth colors
  gold: '#fbbf24',
  goldDark: '#f59e0b',
  silver: '#cbd5e1',
  platinum: '#c7d2fe',
  bronze: '#f59e0b',

  // Status colors
  success: '#4ade80',
  successDark: '#10b981',
  warning: '#fbbf24',
  warningDark: '#f59e0b',
  danger: '#f87171',
  dangerDark: '#ef4444',
  info: '#60a5fa',

  // Chart palette (teal-based)
  chart: [
    '#3B5A69', // Teal
    '#7CA4B4', // Teal Light
    '#7CA4B4', // Teal Muted
    '#E3D3C5', // Ice
    '#3B5A69', // Slate
    '#9F8E75', // Terra
    '#34d399', // Bull
    '#fbbf24', // Gold
  ],
} as const;

// ============================================================================
// LIGHT/DARK MODE THEME COLORS
// ============================================================================

export const getThemeColors = (isDark: boolean) => ({
  // Text colors - REVERSED for dark mode
  dark: isDark ? '#F8F4F0' : '#595959',         // Dark: cream, Light: grey
  white: isDark ? '#595959' : '#F8F4F0',        // Dark: grey, Light: cream
  slate: isDark ? '#F8F4F0' : '#595959',        // Dark: cream, Light: grey
  cream: isDark ? '#F8F4F0' : '#F8F4F0',
  textSecondary: isDark ? '#F8F4F0' : '#595959',
  textOnCard: isDark ? '#595959' : '#595959',   // Charcoal on cards in both modes

  // Background colors
  bg: isDark ? '#2C3B4E' : '#F8F4F0',           // Dark: teal, Light: cream
  cardBg: isDark ? '#F8F4F0' : '#E3D3C5',       // Dark: cream cards, Light: warm beige cards
  cardBgAlt: isDark ? '#E3D3C5' : '#F8F4F0',    // Alternating row color

  // Border colors
  border: isDark ? 'rgba(248,244,240,0.25)' : 'rgba(159, 142, 117, 0.3)',
  borderSubtle: isDark ? 'rgba(248,244,240,0.12)' : 'rgba(159, 142, 117, 0.15)',
  borderStrong: isDark ? 'rgba(248,244,240,0.45)' : 'rgba(159, 142, 117, 0.45)',

  // Brand colors (consistent across themes)
  teal: '#3B5A69',
  lightBlue: '#7CA4B4',

  // Accent colors
  accent1: '#9F8E75',  // Terracotta/brown
  accent2: '#E3D3C5',  // Light blue/grey
  accent3: '#E3D3C5',  // Beige/cream

  // Status colors with backgrounds
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

  // Component specific
  tableHeaderBg: isDark ? '#F8F4F0' : '#9F8E75',   // Dark: cream header, Light: terracotta header
  tableRowEven: isDark ? '#F8F4F0' : '#F8F4F0',    // Cream in both modes
  tableRowOdd: isDark ? '#E3D3C5' : '#E3D3C5',     // Slightly darker in both modes
  cardBgHover: isDark ? 'rgba(248,244,240,0.15)' : 'rgba(159, 142, 117, 0.1)',
});

export type ThemeColors = ReturnType<typeof getThemeColors>;

// ============================================================================
// TAILWIND CLASS HELPERS
// ============================================================================

export const tw = {
  // Card styles
  card: 'glass-card',
  cardGlass: 'glass-card',
  cardStat: 'stat-card',
  cardChart: 'chart-card',

  // Badge styles
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgeGlass: 'badge-glass',
  badgeSuccess: 'badge-success',
  badgeWarning: 'badge-warning',
  badgeDanger: 'badge-danger',

  // Button styles
  btnPrimary: 'glass-btn-primary',
  btnSecondary: 'glass-btn-secondary',
  btnGhost: 'glass-btn-ghost',

  // Text styles
  heading1: 'text-4xl font-bold text-white tracking-tight',
  heading2: 'text-3xl font-bold text-white tracking-tight',
  heading3: 'text-2xl font-semibold text-white',
  heading4: 'text-xl font-semibold text-white',
  bodyLarge: 'text-lg text-white/60',
  bodyRegular: 'text-base text-white/60',
  bodySmall: 'text-sm text-white/60',
  caption: 'text-xs text-white/30',

  // Layout utilities
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12',
  gridCols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  gridCols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  gridCols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',

  // Effects
  transitionSmooth: 'transition-smooth',
  hover: 'hover:transform hover:-translate-y-1 transition-smooth',
  shadow: 'shadow-glass hover:shadow-glass-hover',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "'Inter', system-ui, sans-serif", // Inter is the only approved font
    mono: "'DM Mono', 'Courier New', Courier, monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// ============================================================================
// SPACING & LAYOUT
// ============================================================================

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const duration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    error: colors.danger,
    info: colors.info,
    pending: colors.warning,
    active: colors.success,
    inactive: colors.neutral,
  };
  return statusMap[status.toLowerCase()] || colors.neutral;
};

export const getTierColor = (tier: string): string => {
  const tierMap: Record<string, string> = {
    platinum: colors.platinum,
    gold: colors.gold,
    silver: colors.silver,
    bronze: colors.bronze,
    standard: colors.neutral,
  };
  return tierMap[tier.toLowerCase()] || colors.neutral;
};

export const getMarketColor = (value: number): string => {
  if (value > 0) return colors.bull;
  if (value < 0) return colors.bear;
  return colors.neutral;
};

export const getStageColors = (teal: string, gold: string): Record<string, string> => ({
  '2496931':   '#7CA4B4',
  '2496932':   '#6A929F',
  '2496934':   '#527F8B',
  '100409509': '#3B5A69',
  '2496935':   '#2C3B4E',
  '2496936':   gold,
  '100411705': teal,
});

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatCompactCurrency = (value: number, decimals: number = 2): string => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(decimals)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(decimals)}K`;
  return formatCurrency(value);
};

// ============================================================================
// INTAKE FORM THEME (for form pages)
// ============================================================================

export const THEME = {
  colors: {
    // Primary colors
    charcoal: colors.charcoal,
    white: colors.white,
    slate: colors.slate,
    ice: colors.ice,
    teal: colors.teal,
    cream: colors.cream,

    // Muted variants
    charcoalMuted: 'rgba(51, 51, 51, 0.6)',

    // Status colors
    success: colors.success,
    successLight: 'rgba(74, 222, 128, 0.1)',
    warning: colors.warning,
    warningLight: 'rgba(251, 191, 36, 0.1)',
    error: colors.danger,
    errorLight: 'rgba(248, 113, 113, 0.1)',
    info: colors.info,
    infoLight: 'rgba(96, 165, 250, 0.1)',
  },

  spacing,
  typography,
} as const;

export const STYLES = {
  heading: {
    fontFamily: typography.fontFamily.serif,
    fontWeight: 600,
    color: THEME.colors.charcoal,
    lineHeight: 1.2,
  },
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: THEME.colors.charcoal,
    lineHeight: 1.6,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: 500,
    color: THEME.colors.charcoal,
    marginBottom: '0.5rem',
  },
  input: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${THEME.colors.slate}`,
    width: '100%',
  },
} as const;
