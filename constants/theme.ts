export const colors = {
  bg: {
    primary: '#0D0B14',
    elevated: '#13101C',
    card: '#1A1428',
    input: 'rgba(255,255,255,0.04)',
  },

  purple: {
    DEFAULT: '#A882FF',
    dark: '#7B5EBF',
    soft: 'rgba(168,130,255,0.6)',
    faint: 'rgba(168,130,255,0.12)',
    ghost: 'rgba(168,130,255,0.06)',
    border: 'rgba(168,130,255,0.2)',
    borderStrong: 'rgba(168,130,255,0.4)',
    glow: 'rgba(120,80,200,0.15)',
  },

  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.8)',
    tertiary: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.35)',
    faint: 'rgba(255,255,255,0.25)',
    ghost: 'rgba(255,255,255,0.15)',
  },

  border: {
    subtle: 'rgba(255,255,255,0.04)',
    light: 'rgba(255,255,255,0.06)',
    DEFAULT: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.1)',
  },

  white: '#FFFFFF',
  black: '#000000',
  danger: 'rgba(255,100,100,0.6)',

  gradient: {
    primaryButton: ['#7B5EBF', '#A882FF'] as const,
    cardSurface: ['#1A1428', '#2A1F3D', '#1A1428'] as const,
    ambientGlow: ['rgba(120,80,200,0.15)', '#0D0B14'] as const,
  },
};

export const typography = {
  display: {
    large: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 36,
      letterSpacing: -0.72,
    },
    medium: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 22,
    },
    small: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 18,
      lineHeight: 25,
    },
    card: {
      fontFamily: 'InstrumentSerif-Regular',
      fontSize: 14,
      lineHeight: 18,
    },
  },

  body: {
    large: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      lineHeight: 21,
    },
    default: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      lineHeight: 20,
    },
    small: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 19,
    },
  },

  label: {
    large: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
    },
    default: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
    },
    small: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      letterSpacing: 0.55,
    },
    tiny: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    micro: {
      fontFamily: 'DMSans-Regular',
      fontSize: 9,
      letterSpacing: 0.72,
      textTransform: 'uppercase' as const,
    },
  },

  button: {
    primary: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
    },
    secondary: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
};

export const radius = {
  sm: 4,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  pill: 20,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: 'rgba(100,60,180,1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
  },
  cardReveal: {
    shadowColor: 'rgba(100,60,180,1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 16,
  },
};
