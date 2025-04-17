import { LLMProvider } from '../../types';
import { BaseLLMAdapter } from './BaseAdapter';
import { OpenAIAdapter } from './OpenAI/OpenAIAdapter';
import { GeminiAdapter } from './Gemini/GeminiAdapter';
import { ClaudeAdapter } from './Claude/ClaudeAdapter';

/**
 * Factory class for creating LLM provider adapters
 */
export class LLMAdapterFactory {
  /**
   * Create an appropriate adapter based on the provider type
   */
  static createAdapter(provider: LLMProvider): BaseLLMAdapter {
    // Determine provider type from provider details
    const providerType = provider.type?.toLowerCase() || this.inferProviderType(provider);
    
    // Log detailed model information
    console.log('==============================================');
    console.log(`🤖 LLM Provider: ${providerType.toUpperCase()}`);
    console.log(`🤖 Model: ${provider.defaultParams.model}`);
    console.log(`🤖 Temperature: ${provider.defaultParams.temperature || 'default'}`);
    console.log(`🤖 Max Tokens: ${provider.defaultParams.maxTokens || 'default'}`);
    console.log('==============================================');
    
    switch (providerType) {
      case 'openai':
        return new OpenAIAdapter(provider);
      case 'gemini':
      case 'google':
        return new GeminiAdapter(provider);
      case 'claude':
      case 'anthropic':
        return new ClaudeAdapter(provider);
      default:
        throw new Error(`Unsupported LLM provider type: ${providerType}`);
    }
  }
  
  /**
   * Attempt to infer the provider type from the baseUrl if type is not specified
   */
  private static inferProviderType(provider: LLMProvider): string {
    const baseUrl = provider.baseUrl || '';
    
    if (baseUrl.includes('openai.com')) {
      return 'openai';
    }
    
    if (baseUrl.includes('generativelanguage.googleapis.com')) {
      return 'gemini';
    }
    
    if (baseUrl.includes('anthropic.com')) {
      return 'claude';
    }
    
    // Default to OpenAI for backwards compatibility
    return 'openai';
  }
} 