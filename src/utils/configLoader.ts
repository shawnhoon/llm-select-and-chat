import { LLMProvider } from '../types';

/**
 * Configuration for system prompts
 */
export interface SystemPromptConfig {
  template: string;
  useSearch?: boolean;
  contextLevels?: {
    primary?: boolean;
    immediate?: boolean;
    local?: boolean;
    broader?: boolean;
    conversational?: boolean;
    external?: boolean;
  };
}

/**
 * Default system prompt templates
 */
export const DEFAULT_SYSTEM_PROMPTS: Record<string, SystemPromptConfig> = {
  standard: {
    template: `
1. **Primary Focus:** 
   - Start with the specifically selected text and user's current question
\${useSearch ? \`
   - ALWAYS search when questions ask about:
     * Reviews, ratings, or public reception
     * Author background or other works
     * Sales data or popularity
     * Critical analysis or comparisons
     * Reader feedback or recommendations
   - If the selected text contains outdated or unclear information, use search to verify or update it
   - Always indicate when you're using search to verify selected text
\` : ''}

2. **Immediate Context:** 
   - Use the text immediately before and after the selection to clarify meaning
\${useSearch ? \`
   - If context references external events or facts, use search to provide current information
   - Blend contextual understanding with verified facts
\` : ''}

3. **Local Context:** 
   - Rely on the current chapter for additional detail
\${useSearch ? \`
   - If chapter contains historical or technical information, verify accuracy through search
   - Maintain balance between document content and external verification
\` : ''}

4. **Broader Context:** 
   - Reference full document content only when immediate and local context are insufficient
\${useSearch ? \`
   - Use search to supplement document information when needed
   - Clearly distinguish between document content and external sources
\` : ''}

5. **Conversational Context:** 
   - Build on previous conversation history to enhance understanding
\${useSearch ? \`
   - Use search to follow up on previously discussed topics with current information
   - Maintain consistency between past responses and new search results
\` : ''}

\${useSearch ? \`
6. **External Verification:** 
   - ALWAYS search when encountering:
     * Reviews, ratings, and reader feedback
     * Dates, statistics, or numerical claims
     * Technical specifications or standards
     * Current events or recent developments
     * Scientific or medical information
     * Legal or regulatory information
     * Author information or related works
     * Publication history or editions
     * Cultural impact or reception
   - Verify document claims that seem outdated or uncertain
   - Cross-reference document information with current sources
   - Blend search results naturally with document context

When using search results:
1. ALWAYS cite your sources using [1], [2], etc. at the end of statements from search
2. ALWAYS provide specific quotes or information from each source you reference
3. Format citations like this: "According to [1], the book received critical acclaim"
4. Use multiple sources when available to provide comprehensive information
5. Maintain focus on the user's question while incorporating external information

Example format:
"The book received widespread acclaim for its innovative approach [1]. Critics particularly praised its narrative structure [2], and it went on to win several awards [1][3]."

IMPORTANT: 
- EVERY fact from search must have a citation number
- ALL search information requires proper source attribution
- Include specific quotes or data points from your sources
- Cross-reference multiple sources when possible
- Balance document content with verified external information

Always ground your initial response in the document content, then enhance with search when needed for accuracy or currency.
\` : 'Focus on analyzing and explaining the document content based on the available context.'}
`,
    useSearch: false,
    contextLevels: {
      primary: true,
      immediate: true,
      local: true,
      broader: true,
      conversational: true,
      external: false
    }
  },
  concise: {
    template: `
You are analyzing selected text with surrounding context.
1. Focus primarily on the selected text and user's question.
2. Use context before/after selection to clarify meaning.
3. Refer to broader document context when necessary.
4. Keep responses concise and directly address the user's question.
5. Maintain a helpful, informative tone.
\${useSearch ? 'Use search results to verify factual information, citing sources with [1], [2], etc.' : 'Stick to analyzing the provided text content only.'}
`,
    useSearch: false,
    contextLevels: {
      primary: true,
      immediate: true,
      local: true,
      broader: false,
      conversational: false,
      external: false
    }
  }
};

/**
 * Load a system prompt configuration by name
 * @param name Name of the prompt template
 * @returns System prompt configuration
 */
export function loadSystemPrompt(name: string): SystemPromptConfig {
  return DEFAULT_SYSTEM_PROMPTS[name] || DEFAULT_SYSTEM_PROMPTS.standard;
}

/**
 * Enhance a provider configuration with a system prompt
 * @param provider LLM provider configuration
 * @param promptConfig System prompt configuration or name
 * @returns Enhanced provider configuration with system prompt
 */
export function enhanceProviderWithSystemPrompt(
  provider: LLMProvider, 
  promptConfig: SystemPromptConfig | string
): LLMProvider {
  // If no provider, return as is
  if (!provider) return provider;
  
  try {
    // Get system prompt configuration from name or use as is
    const systemPromptConfig = typeof promptConfig === 'string' 
      ? loadSystemPrompt(promptConfig)
      : promptConfig;
    
    if (!systemPromptConfig) {
      console.warn('⚠️ Could not load system prompt config. Using provider without system prompt.');
      return provider;
    }
    
    if (!systemPromptConfig.template) {
      console.warn('⚠️ System prompt missing template. Using provider without system prompt.');
      return provider;
    }
    
    // Create a new provider with the system prompt
    const enhancedProvider: LLMProvider = {
      ...provider,
      systemPrompt: {
        template: systemPromptConfig.template,
        useSearch: systemPromptConfig.useSearch || false,
        contextLevels: systemPromptConfig.contextLevels || {}
      }
    };
    
    // Log successful enhancement for debugging
    console.log('✅ Enhanced provider with system prompt template:', 
      typeof promptConfig === 'string' ? promptConfig : 'custom template',
      'Search enabled:', systemPromptConfig.useSearch ? 'Yes' : 'No');
    
    return enhancedProvider;
  } catch (error) {
    console.error('❌ Error enhancing provider with system prompt:', error);
    console.warn('⚠️ Using provider without system prompt due to error.');
    return provider;
  }
}

/**
 * Load system prompt templates from a JSON file
 * @param path Path to the JSON configuration file
 * @returns Promise resolving to the system prompt configurations
 */
export async function loadSystemPromptsFromFile(path: string): Promise<Record<string, SystemPromptConfig>> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load system prompt configurations: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Validate that the loaded data is a record of SystemPromptConfig objects
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid system prompt configurations format: expected object');
    }
    
    // Log the successful loading
    console.log(`🧠 Loaded ${Object.keys(data).length} system prompt templates from ${path}`);
    console.log(`Available templates: ${Object.keys(data).join(', ')}`);
    
    return data;
  } catch (error) {
    console.error('Error loading system prompt configurations:', error);
    return DEFAULT_SYSTEM_PROMPTS;
  }
} 