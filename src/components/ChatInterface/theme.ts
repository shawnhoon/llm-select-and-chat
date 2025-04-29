// Chat Interface Theme Variables
// This file centralizes all CSS variables used in the chat interface components

export const chatTheme = {
  // Inject these variables into :root or a container element
  variables: `
    /* Color System */
    --chat-color-primary:rgb(152, 195, 223);
    --chat-color-primary-light: rgba(58, 128, 233, 0.08);
    --chat-color-primary-dark:rgb(91, 137, 205);
    --chat-color-primary-alpha: rgba(58, 128, 233, 0.2);
    --chat-color-surface-primary: #ffffff;
    --chat-color-surface-secondary: #f8f9fa;
    --chat-color-surface-tertiary: #f1f3f5;
    --chat-color-surface-quaternary: #e9ecef;
    --chat-color-text-primary: #212529;
    --chat-color-text-secondary: #6c757d;
    --chat-color-text-tertiary: #adb5bd;
    --chat-color-text-disabled: #ced4da;
    --chat-color-text-on-primary: #ffffff;
    --chat-color-border: #e9ecef;
    --chat-color-border-light: rgba(0, 0, 0, 0.08);
    --chat-color-border-hover: #ced4da;
    --chat-color-status-info: #17a2b8;
    --chat-color-status-success: #28a745;
    --chat-color-status-warning: #ffc107;
    --chat-color-status-error: #dc3545;
    
    /* Minimalist Visual Refresh Colors */
    --chat-color-divider: #E5E5E5;
    --chat-color-user-message: #F0F7FF;
    --chat-color-user-message-hover: #E6F0FF;
    --chat-color-assistant-message: #FFFFFF;
    --chat-color-assistant-message-hover: #F9F9F9;
    --chat-color-assistant-border: #E0E0E0;
    --chat-color-system-message: #F8F8F8;
    --chat-color-hover-overlay: rgba(0, 0, 0, 0.02);
    --chat-color-selection-context-bg: #FAFCFF;

    /* Spacing System - Based on 4px grid */
    --chat-spacing-xxs: 4px;
    --chat-spacing-xs: 8px;
    --chat-spacing-sm: 12px;
    --chat-spacing-md: 16px;
    --chat-spacing-lg: 24px;
    --chat-spacing-xl: 32px;
    --chat-spacing-xxl: 48px;

    /* Typography System */
    --chat-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --chat-font-size-xs: 12px;
    --chat-font-size-sm: 14px;
    --chat-font-size-md: 16px;
    --chat-font-size-lg: 18px;
    --chat-font-size-xl: 20px;
    --chat-font-weight-regular: 400;
    --chat-font-weight-medium: 500;
    --chat-font-weight-semibold: 600;
    --chat-font-weight-bold: 700;
    --chat-line-height-tight: 1.2;
    --chat-line-height-normal: 1.5;
    --chat-line-height-relaxed: 1.75;

    /* Border Radius */
    --chat-border-radius-xs: 4px;
    --chat-border-radius-sm: 8px;
    --chat-border-radius-md: 12px;
    --chat-border-radius-lg: 16px;
    --chat-border-radius-pill: 9999px;
    --chat-border-radius-circle: 50%;

    /* Transitions */
    --chat-transition-duration-fast: 150ms;
    --chat-transition-duration-normal: 250ms;
    --chat-transition-duration-slow: 350ms;
    --chat-transition-timing-ease: cubic-bezier(0.4, 0, 0.2, 1);
    --chat-transition-timing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

    /* Shadows */
    --chat-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);
    --chat-shadow-md: 0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05);
    --chat-shadow-lg: 0 8px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03);

    /* Focus Ring */
    --chat-focus-ring-color: rgba(58, 128, 233, 0.5);
    --chat-focus-ring-width: 3px;
    --chat-focus-ring-offset: 2px;

    /* Scrollbar */
    --chat-scrollbar-width: 8px;
    
    /* Sender Indicator */
    --chat-sender-indicator-size: 24px;
    --chat-sender-indicator-user: var(--chat-color-primary);
    --chat-sender-indicator-assistant: var(--chat-color-status-info);
    --chat-sender-indicator-system: var(--chat-color-text-tertiary);
    --chat-sender-indicator-spacing: 10px;
  `,

  // Helper functions to get CSS variable values
  getVar: (name: string) => `var(--chat-${name})`,
  
  // Common style mixins
  mixins: {
    focusRing: `
      outline: none;
      box-shadow: 0 0 0 var(--chat-focus-ring-width) var(--chat-focus-ring-color);
      outline-offset: var(--chat-focus-ring-offset);
    `,
    transition: (properties: string[]) => `
      transition-property: ${properties.join(', ')};
      transition-duration: var(--chat-transition-duration-normal);
      transition-timing-function: var(--chat-transition-timing-ease);
    `,
    ellipsis: `
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    `,
    messageHover: `
      transition: background-color var(--chat-transition-duration-fast) ease;
      
      &:hover {
        background-color: var(--chat-color-hover-overlay);
      }
    `,
    userMessage: `
      background-color: var(--chat-color-user-message);
      border-radius: var(--chat-border-radius-lg);
      border-bottom-right-radius: var(--chat-border-radius-xs);
      box-shadow: var(--chat-shadow-sm);
      border: 1px solid var(--chat-color-primary-light);
    `,
    assistantMessage: `
      background-color: var(--chat-color-assistant-message);
      border-radius: var(--chat-border-radius-lg);
      border-bottom-left-radius: var(--chat-border-radius-xs);
      border-left: 2px solid var(--chat-color-assistant-border);
      border: 1px solid var(--chat-color-border);
      box-shadow: var(--chat-shadow-sm);
    `,
    systemMessage: `
      background-color: var(--chat-color-system-message);
      border-radius: var(--chat-border-radius-lg);
      border: 1px solid var(--chat-color-border);
      box-shadow: var(--chat-shadow-sm);
    `
  }
};

// Export individual color values for use in JavaScript
export const chatColors = {
  primary: '#3a80e9',
  primaryLight: 'rgba(58, 128, 233, 0.1)',
  primaryDark: '#2c64b8',
  surfacePrimary: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  surfaceTertiary: '#f1f3f5',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  borderLight: 'rgba(0, 0, 0, 0.08)',
  borderMedium: 'rgba(0, 0, 0, 0.12)',
  statusInfo: '#17a2b8',
  statusSuccess: '#28a745',
  statusWarning: '#ffc107',
  statusError: '#dc3545',
  // Minimalist Visual Refresh Colors
  divider: '#E5E5E5',
  userMessage: '#F0F7FF',
  userMessageHover: '#E6F0FF',
  assistantMessage: '#FFFFFF',
  assistantMessageHover: '#F9F9F9',
  assistantBorder: '#E0E0E0',
  systemMessage: '#F8F8F8',
  hoverOverlay: 'rgba(0, 0, 0, 0.02)',
  selectionContextBg: '#FAFCFF'
} as const;

// Export spacing values for use in JavaScript
export const chatSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const; 