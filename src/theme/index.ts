export const theme = {
  colors: {
    // Primárias
    backgroundLight: '#E5E5E5',
    blueLight: '#008BF2',
    
    // Secundárias
    greenGood: '#58CC02',
    redBad: '#EE5555',
    
    // Cores auxiliares
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    grayLight: '#CCCCCC',
    grayDark: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 19,
      xxl: 22,
      xxxl: 28,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
};

export type Theme = typeof theme;

