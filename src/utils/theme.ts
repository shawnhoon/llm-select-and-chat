import { createGlobalStyle, css } from 'styled-components';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  background: string;
  backgroundLight: string;
  backgroundDisabled: string;
  surface: string;
  text: string;
  textSecondary: string;
  textLight: string;
  textOnPrimary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  highlight: string;
  userMessage: string;
  assistantMessage: string;
}

export interface ThemeProps {
  colors: ThemeColors;
  fontSizes: {
    xsmall: string;
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    pill: string;
  };
  boxShadow: {
    small: string;
    medium: string;
    large: string;
  };
  zIndex: {
    base: number;
    popup: number;
    modal: number;
    tooltip: number;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Declare module for styled-components to use our custom theme
declare module 'styled-components' {
  export interface DefaultTheme extends ThemeProps {}
}

export const lightTheme: ThemeColors = {
  primary: '#1a56db',
  primaryDark: '#0f3e9c',
  primaryLight: '#60a5fa',
  secondary: '#7e22ce',
  background: '#ffffff',
  backgroundLight: '#f8fafc',
  backgroundDisabled: '#e2e8f0',
  surface: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textLight: '#94a3b8',
  textOnPrimary: '#ffffff',
  border: '#cbd5e1',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  info: '#0284c7',
  highlight: '#fef9c3',
  userMessage: '#dbedff',
  assistantMessage: '#f1f5f9',
};

export const darkTheme: ThemeColors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#93c5fd',
  secondary: '#a855f7',
  background: '#111827',
  backgroundLight: '#1e293b',
  backgroundDisabled: '#334155',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textLight: '#94a3b8',
  textOnPrimary: '#ffffff',
  border: '#334155',
  error: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
  info: '#38bdf8',
  highlight: '#854d0e',
  userMessage: '#1e3a8a',
  assistantMessage: '#1e293b',
};

export function createTheme(mode: 'light' | 'dark'): ThemeProps {
  const theme = mode === 'light' ? lightTheme : darkTheme;
  
  return {
    colors: {
      ...theme,
    },
    fontSizes: {
      xsmall: '0.75rem',  // 12px
      small: '0.875rem',  // 14px
      medium: '1rem',     // 16px
      large: '1.25rem',   // 20px
      xlarge: '1.5rem',   // 24px
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.5rem',
      large: '0.75rem',
      pill: '9999px',
    },
    boxShadow: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    zIndex: {
      base: 1,
      popup: 10,
      modal: 100,
      tooltip: 1000,
    },
    breakpoints: {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px',
    },
    transitions: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease',
    },
  };
}

// Global styles
export const GlobalStyle = createGlobalStyle<{ theme: ThemeProps }>`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  .select-chat-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    transition: color ${({ theme }) => theme.transitions.normal},
                background-color ${({ theme }) => theme.transitions.normal};
  }
`;

// Media queries
export const media = {
  mobile: (styles: TemplateStringsArray | string) => css`
    @media (max-width: ${createTheme('light').breakpoints.mobile}) {
      ${styles}
    }
  `,
  tablet: (styles: TemplateStringsArray | string) => css`
    @media (min-width: ${createTheme('light').breakpoints.mobile}) and (max-width: ${
      createTheme('light').breakpoints.tablet
    }) {
      ${styles}
    }
  `,
  desktop: (styles: TemplateStringsArray | string) => css`
    @media (min-width: ${createTheme('light').breakpoints.tablet}) {
      ${styles}
    }
  `,
}; 