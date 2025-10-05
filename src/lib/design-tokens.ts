/**
 * WorkLedger Design System Tokens
 * Enterprise-grade design tokens for consistent UI
 */

export const designTokens = {
  colors: {
    // Brand colors - Professional blue palette
    brand: {
      50: 'hsl(217, 100%, 97%)',
      100: 'hsl(217, 95%, 92%)',
      200: 'hsl(217, 95%, 84%)',
      300: 'hsl(217, 92%, 74%)',
      400: 'hsl(217, 89%, 64%)',
      500: 'hsl(217, 83%, 53%)', // Primary brand color
      600: 'hsl(217, 83%, 45%)',
      700: 'hsl(217, 83%, 37%)',
      800: 'hsl(217, 83%, 29%)',
      900: 'hsl(217, 83%, 21%)',
      950: 'hsl(217, 83%, 12%)',
    },

    // Semantic colors - Status indicators
    semantic: {
      success: {
        light: 'hsl(142, 76%, 96%)',
        DEFAULT: 'hsl(142, 76%, 36%)',
        dark: 'hsl(142, 76%, 28%)',
      },
      warning: {
        light: 'hsl(38, 92%, 96%)',
        DEFAULT: 'hsl(38, 92%, 50%)',
        dark: 'hsl(38, 92%, 40%)',
      },
      error: {
        light: 'hsl(0, 84%, 96%)',
        DEFAULT: 'hsl(0, 84%, 60%)',
        dark: 'hsl(0, 84%, 48%)',
      },
      info: {
        light: 'hsl(199, 89%, 96%)',
        DEFAULT: 'hsl(199, 89%, 48%)',
        dark: 'hsl(199, 89%, 38%)',
      },
    },

    // Neutral grays - Refined scale
    gray: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      200: 'hsl(210, 31%, 91%)',
      300: 'hsl(210, 24%, 84%)',
      400: 'hsl(210, 18%, 69%)',
      500: 'hsl(210, 16%, 46%)',
      600: 'hsl(210, 18%, 36%)',
      700: 'hsl(210, 24%, 27%)',
      800: 'hsl(210, 31%, 18%)',
      900: 'hsl(210, 40%, 11%)',
      950: 'hsl(210, 40%, 6%)',
    },

    // Accent colors for data visualization
    accents: {
      purple: {
        light: 'hsl(271, 91%, 96%)',
        DEFAULT: 'hsl(271, 91%, 65%)',
        dark: 'hsl(271, 91%, 45%)',
      },
      pink: {
        light: 'hsl(330, 81%, 96%)',
        DEFAULT: 'hsl(330, 81%, 60%)',
        dark: 'hsl(330, 81%, 45%)',
      },
      orange: {
        light: 'hsl(24, 94%, 96%)',
        DEFAULT: 'hsl(24, 94%, 50%)',
        dark: 'hsl(24, 94%, 40%)',
      },
      teal: {
        light: 'hsl(173, 80%, 96%)',
        DEFAULT: 'hsl(173, 80%, 40%)',
        dark: 'hsl(173, 80%, 30%)',
      },
    },
  },

  typography: {
    // Font families
    fontFamily: {
      sans: 'var(--font-inter)',
      mono: 'var(--font-mono)',
    },

    // Type scale
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.016em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.011em' }],
      xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.014em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.019em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em' }],
      '5xl': ['3rem', { lineHeight: '1.16', letterSpacing: '-0.024em' }],
      '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
    },

    // Font weights
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  spacing: {
    // Extended spacing scale
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  },

  shadows: {
    // Layered shadow system
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',

    // Colored shadows for emphasis
    brandSm: '0 1px 3px 0 rgb(59 130 246 / 0.15)',
    brandMd: '0 4px 6px -1px rgb(59 130 246 / 0.2)',
    brandLg: '0 10px 15px -3px rgb(59 130 246 / 0.3)',
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.625rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  animation: {
    // Timing functions
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Custom easings for premium feel
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
    },

    // Duration scale
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },
} as const

export type DesignTokens = typeof designTokens
