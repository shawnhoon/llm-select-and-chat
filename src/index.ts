// Re-export essential types for external use
export * from './types';

// Re-export components
export { SelectChat } from './components/SelectChat';
export { SelectionCaptureProvider, useSelectionCapture } from './components/SelectionCapture';

// Re-export utils
export { createTheme } from './utils/theme';
export { enhanceProviderWithSystemPrompt } from './utils/configLoader';
export type { SystemPromptConfig } from './utils/configLoader';

// Re-export ThemeProvider from styled-components for convenience
// This allows users to import it directly from our package
import { ThemeProvider } from 'styled-components';
export { ThemeProvider };

// Export system prompt utilities
export { 
  defaultSystemPrompts, 
  getSystemPrompt, 
  initializeSystemPrompts
} from './config/systemPrompts';

// Export adapters
export { OpenAIAdapter } from './components/LLMProviderAdapter/OpenAI/OpenAIAdapter';
export { ClaudeAdapter } from './components/LLMProviderAdapter/Claude/ClaudeAdapter';
export { GeminiAdapter } from './components/LLMProviderAdapter/Gemini/GeminiAdapter';
export { AbstractLLMAdapter } from './components/LLMProviderAdapter/BaseAdapter';
export type { BaseLLMAdapter } from './components/LLMProviderAdapter/BaseAdapter';
export { LLMAdapterFactory } from './components/LLMProviderAdapter/LLMAdapterFactory';

// Export initialization functions
export { initialize, registerSystemPrompt } from './init';

// Export vanilla JS initializer
export { initSelectChat } from './vanilla';

// Export theme utilities
export { 
  lightTheme, 
  darkTheme 
} from './utils/theme';
export type { ThemeProps, ThemeColors } from './utils/theme';

// Export ChatInterface components
export { Message as MessageComponent } from './components/ChatInterface/Message';
export { MessageInput } from './components/ChatInterface/MessageInput';
export { MessageList } from './components/ChatInterface/MessageList';

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

// Export LLM provider adapters
export type { LLMProviderAdapter } from './components/LLMProviderAdapter';

// Export system prompt types
export type { 
  SystemPromptTemplate,
  SystemPromptsCollection,
} from './config'; 