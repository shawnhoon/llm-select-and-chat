/**
 * Configuration exports for the SelectChat component
 */

// Export from systemPrompts.ts
export { 
  defaultSystemPrompts, 
  getSystemPrompt
} from './systemPrompts';

// Export type aliases
export type { 
  SystemPromptTemplate,
  SystemPromptsCollection 
} from './systemPrompts';

// Re-export SystemPromptConfig for convenience
export type { SystemPromptConfig } from '../utils/configLoader'; 