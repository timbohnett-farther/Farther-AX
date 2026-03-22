/**
 * Farther Design Tokens — Dark Theme
 *
 * Centralized color palette and Tailwind class helpers.
 * Replaces duplicated `const C = {...}` objects across files.
 */

// Core brand colors — dark theme
export const colors = {
  // Primary palette
  dark: '#e0dbd3',        // Primary text (light on dark)
  white: '#1e1e1e',       // Surface/card bg (dark)
  slate: '#8a8a8a',       // Secondary text
  teal: '#1d7682',        // Brand accent
  tealDark: '#155a63',    // Darker teal
  tealLight: '#2a9aa8',   // Brighter teal for emphasis

  // Background colors
  bg: '#121212',          // Page background
  bgDark: '#0a0a0a',     // Deeper bg
  cardBg: '#1e1e1e',     // Card background
  border: '#2a2a2a',     // Border color
  borderLight: '#333333',

  // Text colors
  textPrimary: '#e0dbd3',
  textSecondary: '#8a8a8a',
  textMuted: '#6a6a6a',
  textLight: '#c8c2ba',

  // Market colors (brightened for dark bg)
  bull: '#4CAF50',
  bullLight: '#1a2e1c',
  bullDark: '#66BB6A',
  bear: '#EF5350',
  bearLight: '#2e1a1a',
  bearDark: '#EF5350',
  neutral: '#8a8a8a',

  // Tier/wealth colors (brightened for dark bg)
  gold: '#FFB74D',
  goldLight: '#2e2518',
  goldDark: '#FFA726',
  silver: '#90A4AE',
  platinum: '#9fa8da',
  bronze: '#BCAAA4',

  // Status colors (brightened for dark bg)
  success: '#4CAF50',
  warning: '#FFB74D',
  danger: '#EF5350',
  info: '#1d7682',
} as const;

// Tailwind utility class helpers — dark theme
export const tw = {
  // Card styles
  card: 'bg-surface rounded-xl border border-[#2a2a2a] shadow-glass',
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
  btnPrimary: 'bg-teal hover:bg-teal-dark text-charcoal px-4 py-2 rounded-lg font-medium transition-smooth shadow-glow-teal',
  btnSecondary: 'bg-transparent hover:bg-surface-hover text-teal border border-teal px-4 py-2 rounded-lg font-medium transition-smooth',
  btnGhost: 'hover:bg-surface-hover text-charcoal-muted px-4 py-2 rounded-lg font-medium transition-smooth',

  // Text styles
  heading1: 'text-4xl font-serif font-semibold text-charcoal',
  heading2: 'text-3xl font-serif font-semibold text-charcoal',
  heading3: 'text-2xl font-serif font-semibold text-charcoal',
  heading4: 'text-xl font-serif font-semibold text-charcoal',
  bodyLarge: 'text-lg text-charcoal-light',
  bodyRegular: 'text-base text-charcoal-light',
  bodySmall: 'text-sm text-charcoal-muted',
  caption: 'text-xs text-slate',

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

// Typography helpers
export const typography = {
  fontSerif: "'ABC Arizona Text', Georgia, serif",
  fontSans: "'Fakt', system-ui, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', monospace",
} as const;

// Spacing scale (matches Tailwind)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// Border radius scale
export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',   // Pill shape
} as const;

// Animation durations
export const duration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// Breakpoints (matches Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Helper functions for dynamic classes
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

// Format helpers
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

export const formatCompactCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};
