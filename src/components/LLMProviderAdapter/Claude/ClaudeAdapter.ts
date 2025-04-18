import { Message, LLMProvider, Selection } from '../../../types';
import { AbstractLLMAdapter } from '../BaseAdapter';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeSystemPrompt {
  system?: string;
}

interface ClaudeCompletionRequest {
  model: string;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  anthropic_version?: string;
}

interface ClaudeCompletionResponse {
  id: string;
  type: string;
  model: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

export class ClaudeAdapter extends AbstractLLMAdapter {
  constructor(provider: LLMProvider, maxRetries = 3, retryDelay = 1000) {
    super(provider, maxRetries, retryDelay);
  }

  /**
   * Convert SelectChat messages to Claude format
   */
  private convertMessagesToClaudeFormat(
    messages: Message[], 
    selection: Selection | null
  ): { claudeMessages: ClaudeMessage[], systemPrompt: ClaudeSystemPrompt } {
    const claudeMessages: ClaudeMessage[] = [];
    let systemPrompt: ClaudeSystemPrompt = {};
    
    // Add system message as a system prompt in Claude
    systemPrompt.system = this.generateSystemMessage(selection);
    
    // Add selection as context in the first user message if it exists
    if (selection && messages.length > 0 && messages[0].role === 'user') {
      const selectionContext = this.formatSelectionWithContext(selection);
      
      claudeMessages.push({
        role: 'user',
        content: `${selectionContext}\n\n${messages[0].content}`
      });
      
      // Add the rest of the messages
      for (let i = 1; i < messages.length; i++) {
        claudeMessages.push({
          role: messages[i].role === 'user' ? 'user' : 'assistant',
          content: messages[i].content
        });
      }
    } else {
      // No selection or the first message isn't from user, just add all messages
      // Claude API doesn't support a 'system' role in messages array, so we convert any system messages to user
      messages.forEach(message => {
        // Skip system messages as they're handled through the system parameter
        if (message.role === 'system') {
          // If we encounter a system message in the array, add it to the system prompt
          systemPrompt.system = (systemPrompt.system || '') + '\n\n' + message.content;
        } else {
          claudeMessages.push({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content
          });
        }
      });
    }
    
    // If no messages were added, add a placeholder user message
    if (claudeMessages.length === 0) {
      claudeMessages.push({
        role: 'user',
        content: 'Hello, I need your help with understanding the selected text.'
      });
    }
    
    return { claudeMessages, systemPrompt };
  }

  /**
   * Call Claude API with retry logic
   */
  private async callWithRetry(
    url: string, 
    options: RequestInit, 
    attempt = 1
  ): Promise<ClaudeCompletionResponse> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
        
        // If rate limited or server error, retry
        if ((response.status === 429 || response.status >= 500) && attempt <= this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.warn(`Claude API request failed (attempt ${attempt}). Retrying in ${delay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callWithRetry(url, options, attempt + 1);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt <= this.maxRetries && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        // Retry network errors
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(`Claude API request failed (attempt ${attempt}): ${error.message}. Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Send messages to Claude for completion
   */
  public async sendMessages(
    messages: Message[], 
    selection: Selection | null
  ): Promise<string> {
    // Get API details from provider
    const apiKey = this.provider.apiKey;
    if (!apiKey) {
      throw new Error('Claude API key is required.');
    }
    
    const baseUrl = this.provider.baseUrl || 'https://api.anthropic.com/v1';
    const model = this.provider.defaultParams.model || 'claude-3-opus-20240229';
    const temperature = this.provider.defaultParams.temperature;
    const maxTokens = this.provider.defaultParams.maxTokens || 4096;
    
    // Convert messages to Claude format
    const { claudeMessages, systemPrompt } = this.convertMessagesToClaudeFormat(messages, selection);
    
    // Prepare request payload
    const requestPayload: ClaudeCompletionRequest = {
      model,
      messages: claudeMessages,
      anthropic_version: '2023-06-01'
    };
    
    // Add system prompt if available
    if (systemPrompt.system) {
      requestPayload.system = systemPrompt.system;
    }
    
    // Add other parameters if available
    if (temperature !== undefined) {
      requestPayload.temperature = temperature;
    }
    
    if (maxTokens !== undefined) {
      requestPayload.max_tokens = maxTokens;
    }
    
    if (this.provider.defaultParams.topP !== undefined) {
      requestPayload.top_p = this.provider.defaultParams.topP;
    }
    
    // Log the request details
    this.logRequest('Claude', claudeMessages, requestPayload);
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestPayload)
    };
    
    try {
      // Make API request with retry logic
      const response = await this.callWithRetry(
        `${baseUrl}/messages`, 
        requestOptions
      );
      
      // Log the response
      return this.logResponse('Claude', response);
    } catch (error) {
      console.error('Error sending messages to Claude:', error);
      throw error;
    }
  }

  /**
   * Send messages to Claude and receive a structured JSON response
   */
  public async sendMessagesForStructuredResponse<T>(
    messages: Message[],
    selection: Selection | null,
    responseFormat: { type: string; schema?: Record<string, any> }
  ): Promise<T> {
    // Verify response format is valid and supported
    if (responseFormat.type !== 'json') {
      throw new Error("Only 'json' response format is supported");
    }
    
    // Convert messages to Claude format
    const { claudeMessages, systemPrompt } = this.convertMessagesToClaudeFormat(messages, selection);
    
    // Add JSON structure instruction to the last user message
    const lastUserMessageIndex = claudeMessages.length - 1;
    for (let i = lastUserMessageIndex; i >= 0; i--) {
      if (claudeMessages[i].role === 'user') {
        // If there's a schema, include it in the instructions
        if (responseFormat.schema) {
          claudeMessages[i].content += '\n\nPlease provide your response as a JSON object that adheres to the following schema: ' + 
            JSON.stringify(responseFormat.schema);
        } else {
          claudeMessages[i].content += '\n\nPlease provide your response as a valid JSON object.';
        }
        break;
      }
    }
    
    // Get API details from provider
    const apiKey = this.provider.apiKey;
    if (!apiKey) {
      throw new Error('Claude API key is required.');
    }
    
    const baseUrl = this.provider.baseUrl || 'https://api.anthropic.com/v1';
    const model = this.provider.defaultParams.model || 'claude-3-opus-20240229';
    const temperature = this.provider.defaultParams.temperature;
    const maxTokens = this.provider.defaultParams.maxTokens || 4096;
    
    // Prepare request payload
    const requestPayload: ClaudeCompletionRequest = {
      model,
      messages: claudeMessages,
      anthropic_version: '2023-06-01'
    };
    
    // Add system prompt if available
    if (systemPrompt.system) {
      requestPayload.system = systemPrompt.system;
    }
    
    // Add other parameters if available
    if (temperature !== undefined) {
      requestPayload.temperature = temperature;
    }
    
    if (maxTokens !== undefined) {
      requestPayload.max_tokens = maxTokens;
    }
    
    if (this.provider.defaultParams.topP !== undefined) {
      requestPayload.top_p = this.provider.defaultParams.topP;
    }
    
    // Log the request details
    this.logRequest('Claude', claudeMessages, requestPayload);
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestPayload)
    };
    
    try {
      // Make API request with retry logic
      const response = await this.callWithRetry(
        `${baseUrl}/messages`, 
        requestOptions
      );
      
      // Log the response
      const responseContent = response.content && response.content.length > 0 ? response.content[0].text : '';
      this.logResponse('Claude', response);
      
      try {
        // Some post-processing to handle potential markdown code blocks
        const jsonContent = responseContent.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        return JSON.parse(jsonContent) as T;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Failed to parse structured response from Claude.');
      }
    } catch (error) {
      console.error('Error sending messages to Claude for structured response:', error);
      throw error;
    }
  }
} 