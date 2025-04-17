import { Message, Selection, LLMProvider } from '../../types';

export interface LLMProviderAdapter {
  /**
   * The provider type this adapter is for
   */
  provider: LLMProvider;
  
  /**
   * Sends messages to the LLM and returns the response content.
   * @param messages Array of messages in the conversation
   * @param selection Optional currently selected text with context
   * @returns Promise with the LLM response content
   */
  sendMessages(messages: Message[], selection: Selection | null): Promise<string>;
} 