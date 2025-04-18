import { initializeSystemPrompts } from './config/systemPrompts';
import { SystemPromptConfig } from './utils/configLoader';

/**
 * Initialize the application with custom system prompts
 * @param options Initialization options
 * @returns Promise that resolves when initialization is complete
 */
export async function initialize(options?: {
  systemPromptsPath?: string;
}): Promise<void> {
  console.log('🚀 Initializing LLM Select and Chat...');
  
  // Initialize system prompts
  if (options?.systemPromptsPath) {
    console.log(`Loading system prompts from: ${options.systemPromptsPath}`);
    await initializeSystemPrompts(options.systemPromptsPath);
  } else {
    console.log('Using default system prompts (no custom path provided)');
    await initializeSystemPrompts();
  }
  
  console.log('✅ LLM Select and Chat initialized');
}

/**
 * Register a custom system prompt template
 * @param name Name of the template
 * @param config Template configuration
 */
export function registerSystemPrompt(name: string, config: SystemPromptConfig): void {
  // This will be implemented in a future update
  console.log(`Registering custom system prompt template: ${name}`);
} 