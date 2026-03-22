/**
 * Farther Design Tokens — Dark Glass Theme
 *
 * Centralized color palette and Tailwind class helpers.
 * Matches the Farther Marketing Command Center Brand Spec.
 */

// Core brand colors
export const colors = {
  // Core 5
  charcoal: '#333333',
  white: '#ffffff',
  slate: '#5b6a71',
  ice: '#b6d0ed',
  teal: '#1d7682',
  tealDark: '#155961',
  tealLight: '#28a1af',

  // Background gradient stops
  bg600: '#2a2a2a',
  bg800: '#1a1a1a',
  bg900: '#111111',

  // Surface
  cardBg: '#2f2f2f',
  border: 'rgba(250, 247, 242, 0.08)',
  borderSubtle: 'rgba(250, 247, 242, 0.05)',

  // Text (cream-based)
  textPrimary: '#FAF7F2',
  textSecondary: 'rgba(250, 247, 242, 0.6)',
  textMuted: 'rgba(250, 247, 242, 0.4)',
  textTertiary: 'rgba(250, 247, 242, 0.3)',

  // Market colors
  bull: '#10b981',
  bullDark: '#059669',
  bear: '#ef4444',
  bearDark: '#dc2626',
  neutral: '#6b7280',

  // Tier/wealth colors
  gold: '#f59e0b',
  goldDark: '#d97706',
  silver: '#94a3b8',
  platinum: '#e0e7ff',
  bronze: '#d97706',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#1d7682',

  // Chart palette
  chart: ['#1d7682', '#28a1af', '#b6d0ed', '#88cbd3', '#5b6a71', '#8a9aa2'],
} as const;

// Tailwind utility class helpers
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

  // Text styles (white at varying opacity)
  heading1: 'text-4xl font-serif font-semibold text-white tracking-wide',
  heading2: 'text-3xl font-serif font-semibold text-white tracking-wide',
  heading3: 'text-2xl font-serif font-semibold text-white',
  heading4: 'text-xl font-serif font-semibold text-white',
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

// Typography helpers
export const typography = {
  fontSerif: "'ABC Arizona Text', Georgia, serif",
  fontSans: "'Fakt', system-ui, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', monospace",
} as const;

// Spacing scale (matches Tailwind)
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

// Border radius scale
export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

// Animation durations
export const duration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Helper functions
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
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
};
