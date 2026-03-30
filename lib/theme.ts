// Farther AX Design System — Single Source of Truth
// Ported from Farther Billing Portal theme system
// Dark mode: steel-blue surfaces, limestone text, clay brand, serene aqua accent
// Light mode: limestone surfaces, charcoal text, steel-blue accents
// "Warm first, tech second. Creams and browns as the foundation."

import type React from 'react';

// =============================================================================
// CORE BRAND PALETTE (mode-independent atomic tokens)
// =============================================================================

const PALETTE = {
  // Clay (warm sand/tan — brand anchor)
  clay25: '#FAFAFA',
  clay50: '#F5F4F1',
  clay100: '#E6E3DB',
  clay200: '#CFC8B9',
  clay300: '#B3A791',
  clay400: '#9F8E75',
  clay500: '#8E7B64',
  clay600: '#7A6654',
  clay700: '#625146',
  clay800: '#55453E',
  clay900: '#4A3E39',

  // Limestone (warm cream)
  limestone50: '#F8F4F0',
  limestone100: '#F2EAE2',
  limestone200: '#E3D3C5',
  limestone300: '#D1B6A0',
  limestone400: '#BE9479',
  limestone500: '#B17B5E',

  // Steel Blue (cool structure)
  steelBlue25: '#FBFDFF',
  steelBlue50: '#F5F8FA',
  steelBlue100: '#EBF0F3',
  steelBlue200: '#D2DFE5',
  steelBlue300: '#94B5C3',
  steelBlue400: '#7CA4B4',
  steelBlue500: '#5B8A9C',
  steelBlue600: '#476F82',
  steelBlue700: '#3B5A69',
  steelBlue800: '#334D59',
  steelBlue900: '#2F424B',

  // Support
  graniteBlue900: '#2C3B4E',
  slateBlue200: '#CCD2D5',
  slateBlue400: '#7C8D94',
  slateBlue500: '#5B6A71',
  smaltBlue700: '#3F535F',
  charcoal100: '#E7E7E7',
  charcoal200: '#D1D1D1',
  charcoal500: '#6D6D6D',
  charcoal700: '#4F4F4F',
  charcoal900: '#333333',
  sereneAqua400: '#5DCCDB',
  sereneAqua600: '#289FAF',
  sereneAqua700: '#1D7682',
  pomegranate500: '#CE3657',
  bronze400: '#B68A4C',

  white: '#FFFFFF',
} as const;

// =============================================================================
// createTheme(mode) — Returns mode-aware THEME + STYLES + CHART_COLORS
// =============================================================================

export type ThemeMode = 'light' | 'dark';

export function createTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  const colors = {
    // === Farther Brand Palette (Atomic — mode-independent) ===
    ...PALETTE,

    // === Backward-compat aliases ===
    steel: PALETTE.steelBlue700,
    graphite: PALETTE.steelBlue900,
    slate: PALETTE.steelBlue800,
    ivory: PALETTE.limestone50,
    linen: PALETTE.clay50,
    mist: PALETTE.steelBlue200,
    sky: PALETTE.steelBlue300,
    aqua: PALETTE.sereneAqua400,
    terra: PALETTE.clay400,
    grayCool: PALETTE.slateBlue400,
    grayDeep: PALETTE.slateBlue500,

    teal: PALETTE.steelBlue700,
    tealLight: PALETTE.steelBlue300,
    tealDark: PALETTE.steelBlue900,
    tealGlow: 'rgba(59, 90, 105, 0.18)',
    ice: PALETTE.steelBlue200,
    iceLight: PALETTE.steelBlue300,

    // === Backgrounds (mode-aware) ===
    bg: isDark ? '#2F424B' : '#F8F4F0',
    bgSoft: isDark ? '#334D59' : '#FFFFFF',
    bgElevated: isDark ? '#3F535F' : '#FFFFFF',
    bgDeep: isDark ? '#2F424B' : '#F8F4F0',

    // === Surfaces (mode-aware) ===
    surface: isDark ? '#3B5A69' : '#FFFFFF',
    surfaceHover: isDark ? '#476F82' : '#F5F8FA',
    surfaceSubtle: isDark ? 'rgba(59, 90, 105, 0.30)' : 'rgba(59, 90, 105, 0.06)',

    // === Text hierarchy (mode-aware) ===
    text: isDark ? '#F8F4F0' : '#333333',
    textHeading: isDark ? '#F8F4F0' : '#333333',
    textSecondary: isDark ? '#CCD2D5' : '#5B6A71',
    textMuted: isDark ? '#7C8D94' : '#7C8D94',
    textFaint: isDark ? 'rgba(248, 244, 240, 0.45)' : 'rgba(51, 51, 51, 0.35)',

    // Card text (mode-aware)
    cardText: isDark ? '#F8F4F0' : '#333333',
    cardTextHeading: isDark ? '#F8F4F0' : '#333333',
    cardTextSecondary: isDark ? '#CCD2D5' : '#5B6A71',
    cardTextMuted: isDark ? '#7C8D94' : '#7C8D94',
    cardTextFaint: isDark ? 'rgba(248, 244, 240, 0.45)' : 'rgba(51, 51, 51, 0.35)',

    // Sidebar-specific text (mode-aware)
    sidebarText: isDark ? '#F8F4F0' : '#333333',                      // Light mode: charcoal
    sidebarTextSecondary: isDark ? '#CCD2D5' : '#5B6A71',             // Light mode: slate blue
    sidebarTextMuted: isDark ? '#7C8D94' : '#7C8D94',                 // Consistent across modes
    sidebarTextFaint: isDark ? 'rgba(248, 244, 240, 0.45)' : 'rgba(51, 51, 51, 0.35)',  // Light mode: charcoal opacity

    // === Accent colors ===
    accent1: PALETTE.clay400,
    accent2: PALETTE.sereneAqua400,
    accent3: PALETTE.steelBlue300,

    // Special use
    numberColor: isDark ? '#F8F4F0' : '#333333',

    // High-contrast data values
    dataPositive: '#4ADE80',
    dataNegative: '#FB7185',

    // === Status colors (consistent across modes) ===
    success: '#6DBF7B',
    successBg: isDark ? 'rgba(109, 191, 123, 0.12)' : 'rgba(109, 191, 123, 0.10)',
    successBorder: '#4FA066',

    warning: '#C49A5C',
    warningBg: isDark ? 'rgba(196, 154, 92, 0.12)' : 'rgba(196, 154, 92, 0.10)',
    warningBorder: '#A8834E',

    error: '#D4736E',
    errorBg: isDark ? 'rgba(212, 115, 110, 0.12)' : 'rgba(212, 115, 110, 0.10)',
    errorBorder: '#B8605C',

    neutral: '#B0ACA4',
    neutralBg: isDark ? 'rgba(176, 172, 164, 0.10)' : 'rgba(176, 172, 164, 0.08)',

    info: '#7CA4B4',
    infoBg: isDark ? 'rgba(124, 164, 180, 0.12)' : 'rgba(124, 164, 180, 0.10)',

    // === Borders (mode-aware) ===
    border: isDark ? 'rgba(148, 181, 195, 0.18)' : 'rgba(59, 90, 105, 0.15)',
    borderSubtle: isDark ? 'rgba(148, 181, 195, 0.10)' : 'rgba(59, 90, 105, 0.08)',
    borderStrong: isDark ? '#5B8A9C' : 'rgba(59, 90, 105, 0.25)',

    // === Chart series ===
    chartSeries: [
      '#94B5C3',
      '#5DCCDB',
      '#9F8E75',
      '#5B8A9C',
      '#D1B6A0',
      '#CCD2D5',
      '#2C3B4E',
      '#B17B5E',
    ] as readonly string[],

    // === Tier badge colors ===
    tiers: {
      platinum:   { text: '#CCD2D5', bg: 'rgba(148, 181, 195, 0.20)' },
      gold:       { text: '#B68A4C', bg: 'rgba(182, 138, 76, 0.20)' },
      silver:     { text: '#94B5C3', bg: 'rgba(148, 181, 195, 0.15)' },
      bronze:     { text: '#D1B6A0', bg: 'rgba(209, 182, 160, 0.20)' },
      emerging:   { text: '#5DCCDB', bg: 'rgba(93, 204, 219, 0.20)' },
      developing: { text: '#7CA4B4', bg: 'rgba(124, 164, 180, 0.12)' },
    },

    // === Flag / alert badge colors ===
    flags: {
      critical: { text: '#D4736E', bg: 'rgba(212, 115, 110, 0.10)', border: '#B8605C' },
      warning:  { text: '#C49A5C', bg: 'rgba(196, 154, 92, 0.10)',  border: '#A8834E' },
      positive: { text: '#6DBF7B', bg: 'rgba(109, 191, 123, 0.10)', border: '#4FA066' },
      info:     { text: '#7CA4B4', bg: 'rgba(124, 164, 180, 0.10)', border: '#5B8A9C' },
    },

    // === Utility ===
    shadow: 'rgba(0, 0, 0, 0.36)',
    shadowMedium: 'rgba(0, 0, 0, 0.25)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  const typography = {
    fontFamily: {
      serif: "'ABC Arizona Text', Georgia, serif",
      sans: "'Fakt', 'Inter', Arial, sans-serif",
      mono: "'Fakt Mono', 'DM Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: '11px',
      sm: '13px',
      base: '15px',
      md: '16px',
      lg: '18px',
      xl: '22px',
      '2xl': '28px',
      '3xl': '36px',
      '4xl': '48px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  };

  const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    '4xl': '48px',
    '5xl': '64px',
  };

  const layout = {
    sidebarWidth: '288px',
    mainPadding: '40px',
    maxContentWidth: '1400px',
    headerHeight: '64px',
    mobileHeaderHeight: '56px',
    cardBorderRadius: '16px',
    borderRadius: '8px',
    borderRadiusSm: '6px',
  };

  const shadows = {
    sm: 'var(--ax-shadow-sm, 0 1px 2px rgba(59, 90, 105, 0.08))',
    md: isDark
      ? '0 4px 8px rgba(59, 90, 105, 0.10), 0 1px 2px rgba(59, 90, 105, 0.06)'
      : '0 4px 8px rgba(59, 90, 105, 0.06), 0 1px 2px rgba(59, 90, 105, 0.04)',
    lg: isDark
      ? '0 12px 24px rgba(59, 90, 105, 0.12), 0 4px 8px rgba(59, 90, 105, 0.08)'
      : '0 12px 24px rgba(59, 90, 105, 0.08), 0 4px 8px rgba(59, 90, 105, 0.05)',
    xl: isDark
      ? '0 16px 32px rgba(0, 0, 0, 0.20), 0 8px 16px rgba(0, 0, 0, 0.12)'
      : '0 16px 32px rgba(0, 0, 0, 0.10), 0 8px 16px rgba(0, 0, 0, 0.06)',
    glowSteel: '0 0 20px rgba(59, 90, 105, 0.35)',
    glowAccent: '0 0 18px rgba(93, 204, 219, 0.40)',
  };

  const transitions = {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  };

  const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1025,
  };

  const THEME = {
    mode,
    colors,
    typography,
    spacing,
    layout,
    shadows,
    transitions,
    breakpoints,
  } as const;

  // =========================================================================
  // STYLES — Reusable component style presets (mode-aware)
  // =========================================================================

  const STYLES = {
    card: {
      backgroundColor: colors.surface,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.md,
      padding: spacing.xl,
      transition: 'box-shadow 250ms ease, border-color 250ms ease, transform 250ms ease',
    } as React.CSSProperties,

    cardHover: {
      backgroundColor: colors.surfaceHover,
      borderColor: colors.borderStrong,
      boxShadow: shadows.lg,
      transform: 'translateY(-1px)',
    } as React.CSSProperties,

    cardGlass: {
      backgroundColor: colors.surface,
      borderRadius: layout.cardBorderRadius,
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.md,
      padding: spacing.xl,
    } as React.CSSProperties,

    cardGlassHover: {
      boxShadow: shadows.lg,
      borderColor: colors.borderStrong,
      transform: 'translateY(-1px)',
    } as React.CSSProperties,

    tooltipGlass: {
      borderRadius: layout.borderRadiusSm,
      border: `1px solid ${colors.border}`,
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.sm,
      boxShadow: shadows.lg,
      backgroundColor: isDark ? 'rgba(51, 77, 89, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(8px)',
      color: colors.text,
    } as React.CSSProperties,

    heading: {
      fontFamily: typography.fontFamily.serif,
      color: colors.textHeading,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      margin: 0,
    } as React.CSSProperties,

    body: {
      fontFamily: typography.fontFamily.sans,
      color: colors.text,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
    } as React.CSSProperties,

    label: {
      fontFamily: typography.fontFamily.sans,
      fontSize: '12px',
      fontWeight: 600,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
    } as React.CSSProperties,

    button: {
      primary: {
        backgroundColor: colors.accent1,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: layout.borderRadius,
        padding: `${spacing.md} ${spacing.xl}`,
        fontFamily: typography.fontFamily.sans,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.sm,
        boxShadow: shadows.sm,
      } as React.CSSProperties,

      secondary: {
        backgroundColor: 'transparent',
        color: colors.steelBlue300,
        border: `1px solid ${colors.border}`,
        borderRadius: layout.borderRadius,
        padding: `${spacing.md} ${spacing.xl}`,
        fontFamily: typography.fontFamily.sans,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.sm,
      } as React.CSSProperties,

      ghost: {
        backgroundColor: 'transparent',
        color: colors.textSecondary,
        border: 'none',
        borderRadius: layout.borderRadius,
        padding: `${spacing.sm} ${spacing.md}`,
        fontFamily: typography.fontFamily.sans,
        fontSize: typography.fontSize.sm,
        cursor: 'pointer',
        transition: `background-color ${transitions.fast}`,
      } as React.CSSProperties,
    },

    input: {
      width: '100%',
      padding: `${spacing.md} ${spacing.lg}`,
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.base,
      color: colors.text,
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      outline: 'none',
      transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    badge: (color: string, bgColor: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: `2px ${spacing.sm}`,
      borderRadius: '100px',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      fontFamily: typography.fontFamily.sans,
      color,
      backgroundColor: bgColor,
    } as React.CSSProperties),

    table: {
      container: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontFamily: typography.fontFamily.sans,
        fontSize: typography.fontSize.sm,
      } as React.CSSProperties,

      header: {
        textAlign: 'left' as const,
        padding: `${spacing.md} ${spacing.lg}`,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textSecondary,
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        borderBottom: `2px solid ${colors.border}`,
        backgroundColor: colors.surfaceSubtle,
      } as React.CSSProperties,

      cell: {
        padding: `${spacing.md} ${spacing.lg}`,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        color: colors.text,
      } as React.CSSProperties,

      rowEven: {
        backgroundColor: isDark ? 'rgba(59, 90, 105, 0.15)' : 'rgba(59, 90, 105, 0.04)',
        transition: `background-color ${transitions.fast}`,
      } as React.CSSProperties,

      rowOdd: {
        backgroundColor: isDark ? 'rgba(59, 90, 105, 0.08)' : 'transparent',
        transition: `background-color ${transitions.fast}`,
      } as React.CSSProperties,

      row: {
        transition: `background-color ${transitions.fast}`,
      } as React.CSSProperties,
    },

    select: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.sm,
      color: colors.text,
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: layout.borderRadiusSm,
      outline: 'none',
      cursor: 'pointer',
    } as React.CSSProperties,

    link: {
      color: colors.sereneAqua400,
      fontWeight: typography.fontWeight.semibold,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: `color ${transitions.fast}`,
    } as React.CSSProperties,

    trendPositive: {
      color: colors.success,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,

    trendNegative: {
      color: colors.error,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,
  } as const;

  // =========================================================================
  // CHART_COLORS
  // =========================================================================

  const CHART_COLORS = [
    '#94B5C3',
    '#5DCCDB',
    '#9F8E75',
    '#5B8A9C',
    '#D1B6A0',
    '#CCD2D5',
    '#2C3B4E',
    '#B17B5E',
  ] as const;

  return { THEME, STYLES, CHART_COLORS };
}

// =============================================================================
// Static exports for non-component code (API routes, server utils)
// These use dark mode as the default
// =============================================================================

const { THEME: _darkTheme, STYLES: _darkStyles, CHART_COLORS: _defaultChartColors } = createTheme('dark');

export const THEME = _darkTheme;
export const STYLES = _darkStyles;
export const CHART_COLORS = _defaultChartColors;

// Re-export types
export type ThemeType = ReturnType<typeof createTheme>['THEME'];
export type StylesType = ReturnType<typeof createTheme>['STYLES'];

// =============================================================================
// Format helpers (unchanged from billing portal)
// =============================================================================

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatBps(value: number): string {
  return `${value.toFixed(1)} bps`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatCompactCurrency(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(decimals)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(decimals)}K`;
  return `$${value.toFixed(0)}`;
}

export function heatmapColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped >= 0.5) {
    const t = (clamped - 0.5) * 2;
    return `rgba(109, 191, 123, ${0.1 + t * 0.35})`;
  }
  const t = (0.5 - clamped) * 2;
  return `rgba(212, 115, 110, ${0.1 + t * 0.35})`;
}

// =============================================================================
// Legacy compatibility helpers
// =============================================================================

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    success: '#6DBF7B',
    warning: '#C49A5C',
    danger: '#D4736E',
    error: '#D4736E',
    info: '#7CA4B4',
    pending: '#C49A5C',
    active: '#6DBF7B',
    inactive: '#B0ACA4',
  };
  return map[status.toLowerCase()] || '#B0ACA4';
}

export function getTierColor(tier: string): string {
  const map: Record<string, string> = {
    platinum: '#CCD2D5',
    gold: '#B68A4C',
    silver: '#94B5C3',
    bronze: '#D1B6A0',
    standard: '#B0ACA4',
  };
  return map[tier.toLowerCase()] || '#B0ACA4';
}

export function getMarketColor(value: number): string {
  if (value > 0) return '#4ADE80';
  if (value < 0) return '#FB7185';
  return '#B0ACA4';
}

export const getStageColors = (): Record<string, string> => ({
  '2496931':   '#7CA4B4',
  '2496932':   '#6A929F',
  '2496934':   '#527F8B',
  '100409509': '#3B5A69',
  '2496935':   '#2C3B4E',
  '2496936':   '#B68A4C',
  '100411705': '#3B5A69',
});
