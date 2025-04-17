// Export components
export { SelectChat } from './components/SelectChat';
export { ChatInterface } from './components/ChatInterface';

// Export adapters
export { OpenAIAdapter } from './components/LLMProviderAdapter';
export type { LLMProviderAdapter } from './components/LLMProviderAdapter';

// Export types for consumers
export type {
  Message,
  Conversation,
  Selection,
  Attachment,
  Annotation,
  LLMProvider,
  UserPreferences,
  SelectChatProps
} from './types';

// Export theme utilities
export { 
  createTheme, 
  lightTheme, 
  darkTheme 
} from './utils/theme';
export type { ThemeProps, ThemeColors } from './utils/theme';

// Export vanilla JS initializer
export { initSelectChat } from './vanilla';

// Export SelectionCapture components
export { SelectionCaptureProvider } from './components/SelectionCapture';
export { useSelectionCapture } from './components/SelectionCapture/useSelectionCapture';

// Export ChatInterface components
export { Message as MessageComponent } from './components/ChatInterface/Message';
export { MessageInput } from './components/ChatInterface/MessageInput';
export { MessageList } from './components/ChatInterface/MessageList';

// Export LLM provider adapters
export {
  GeminiAdapter,
  AbstractLLMAdapter,
  LLMAdapterFactory,
} from './components/LLMProviderAdapter';

export type { BaseLLMAdapter } from './components/LLMProviderAdapter'; 