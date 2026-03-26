/**
 * Theme configuration for intake forms
 * Provides a structured theme object compatible with inline styles
 */

import { colors as designColors, spacing as designSpacing } from './design-tokens';

export const THEME = {
  colors: {
    // Primary colors
    charcoal: designColors.charcoal,
    white: designColors.white,
    slate: designColors.slate,
    ice: designColors.ice,
    teal: designColors.teal,
    cream: '#FAF7F2',

    // Muted variants
    charcoalMuted: 'rgba(51, 51, 51, 0.6)',

    // Status colors
    success: designColors.success,
    successLight: 'rgba(74, 222, 128, 0.1)',
    warning: designColors.warning,
    warningLight: 'rgba(251, 191, 36, 0.1)',
    error: designColors.danger,
    errorLight: 'rgba(248, 113, 113, 0.1)',
    info: designColors.info,
    infoLight: 'rgba(96, 165, 250, 0.1)',
  },

  spacing: designSpacing,

  typography: {
    fontFamily: {
      serif: "'Inter', system-ui, sans-serif",
      sans: "'Inter', system-ui, sans-serif",
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
  },
} as const;

export const STYLES = {
  heading: {
    fontFamily: THEME.typography.fontFamily.serif,
    fontWeight: 600,
    color: THEME.colors.charcoal,
    lineHeight: 1.2,
  },
  body: {
    fontFamily: THEME.typography.fontFamily.sans,
    fontSize: THEME.typography.fontSize.base,
    color: THEME.colors.charcoal,
    lineHeight: 1.6,
  },
  label: {
    fontFamily: THEME.typography.fontFamily.sans,
    fontSize: THEME.typography.fontSize.sm,
    fontWeight: 500,
    color: THEME.colors.charcoal,
    marginBottom: '0.5rem',
  },
  input: {
    fontFamily: THEME.typography.fontFamily.sans,
    fontSize: THEME.typography.fontSize.base,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${THEME.colors.slate}`,
    width: '100%',
  },
} as const;
