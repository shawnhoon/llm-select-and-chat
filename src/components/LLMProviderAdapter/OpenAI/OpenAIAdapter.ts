import { Message, LLMProvider, Selection, Attachment } from '../../../types';
import { AbstractLLMAdapter } from '../BaseAdapter';

interface OpenAIMessage {
  role: string;
  content: string | Array<{type: string, [key: string]: any}>;
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Helper function to determine if a model needs the new parameter format
function isModelWithNewTokenFormat(modelName: string): boolean {
  // New models that use max_completion_tokens instead of max_tokens
  const newFormatModels = [
    'o4', // Includes o4-mini, o4-preview, etc.
    'gpt-4-vision',
    'gpt-4-turbo',
    'gpt-4-1106',
    'gpt-4-0125',
    'gpt-4-vision-preview',
    '2025', // Catches date-based versions
    'mini',
    'vision'
  ];
  
  return newFormatModels.some(prefix => modelName.toLowerCase().includes(prefix.toLowerCase()));
}

// Helper function to check if a model requires default temperature (doesn't support custom temperature)
function requiresDefaultTemperature(modelName: string): boolean {
  // Models that only support default temperature value
  const defaultTempModels = [
    'o4', // Catch all variants of o4 models including o4-mini
    'gpt-4-vision',
    'gpt-4-turbo',
    'mini',
    '2025', // Catches date-based versions
    'vision'
  ];
  
  // If model name includes any of these patterns, assume it requires default params
  return defaultTempModels.some(model => modelName.toLowerCase().includes(model.toLowerCase()));
}

// Helper function to check if model is o4-mini
function isO4MiniModel(modelName: string): boolean {
  return modelName.toLowerCase().includes('o4-mini');
}

export class OpenAIAdapter extends AbstractLLMAdapter {
  private apiEndpoint: string;
  
  constructor(provider: LLMProvider) {
    super(provider);
    this.apiEndpoint = provider.baseUrl || 'https://api.openai.com/v1/chat/completions';
  }
  
  // Override for OpenAI-specific image handling
  protected async convertImageAttachment(attachment: Attachment): Promise<any> {
    if (attachment.type !== 'image') {
      throw new Error(`Unsupported attachment type: ${attachment.type}`);
    }
    
    let imageUrl: string;
    
    if (attachment.data instanceof Blob) {
      // Convert blob to base64 data URL
      imageUrl = await this.blobToBase64(attachment.data);
    } else if (attachment.url) {
      // Use the existing URL if it's already a data URL or an accessible URL
      imageUrl = attachment.url;
    } else {
      throw new Error('Image attachment must contain either data or url');
    }
    
    // Return in OpenAI's expected format
    return {
      type: "image_url",
      image_url: {
        url: imageUrl
      }
    };
  }
  
  private convertMessagesToOpenAIFormat(messages: Message[]): OpenAIMessage[] {
    return messages.map(message => {
      const role = message.role === 'user' ? 'user' : 'assistant';
      return {
        role,
        content: message.content
      };
    });
  }
  
  public async sendMessages(
    messages: Message[],
    selection: Selection | null
  ): Promise<string> {
    // Process selection if present
    let processedMessages = [...messages];
    
    // If we have a selection object, add content to the first user message
    if (selection) {
      const firstUserIndex = processedMessages.findIndex(m => m.role === 'user');
      if (firstUserIndex >= 0) {
        // Format the selection with context - this will include the full document
        // even if no specific text is selected
        const selectionText = this.formatSelectionWithContext(selection);
        
        // Log document sizes for debugging
        console.log(`📄 OpenAIAdapter: Processing selection with total formatted length: ${selectionText.length} characters`); 
        
        // Add to the existing message
        processedMessages[firstUserIndex] = {
          ...processedMessages[firstUserIndex],
          content: `${selectionText}\n\n${processedMessages[firstUserIndex].content}`
        };
      }
    }
    
    // Check if messages contain attachments
    const hasAttachments = processedMessages.some(message => 
      message.attachments && message.attachments.length > 0
    );
    
    let formattedMessages: OpenAIMessage[];
    
    if (hasAttachments) {
      // Handle messages with attachments
      formattedMessages = await this.formatMessagesWithAttachments(processedMessages);
    } else {
      // Standard text-only messages
      formattedMessages = this.convertMessagesToOpenAIFormat(processedMessages);
    }
    
    // Generate system prompt based on selection and add it as the first message
    // Only add if there's not already a system message at the beginning
    const systemPrompt = this.generateSystemMessage(selection);
    if (formattedMessages.length === 0 || formattedMessages[0].role !== 'system') {
      formattedMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    // Get the model name once for all the checks below
    const modelName = this.provider.defaultParams.model;
    
    // Add developer message for o4-mini model to enable markdown formatting
    if (isO4MiniModel(modelName)) {
      formattedMessages.unshift({
        role: 'developer',
        content: [{
          type: 'text',
          text: 'Formatting re-enabled'
        }]
      });
    }
    
    // Prepare the request body
    const requestBody: OpenAICompletionRequest = {
      model: modelName,
      messages: formattedMessages
    };
    
    // Ensure we have an appropriate maxTokens value for processing large documents
    // For o4 models, increase the default max tokens for handling large documents
    let maxTokens = this.provider.defaultParams.maxTokens;
    if ((modelName.includes('o4') || modelName.includes('gpt-4.1') || modelName.includes('gemini-2.0')) && 
        (!maxTokens || maxTokens < 32000)) {
      console.log(`📊 Adjusting maxTokens for ${modelName} from ${maxTokens || 'default'} to 32000 for large context window`);
      maxTokens = 32000;
    }
    
    // Add temperature parameter if supported by the model
    if (this.provider.defaultParams.temperature !== undefined && !requiresDefaultTemperature(modelName)) {
      requestBody.temperature = this.provider.defaultParams.temperature;
    }
    
    // Add max tokens parameter if specified
    if (maxTokens !== undefined) {
      // Only add max tokens for models that support non-default temperature
      if (isModelWithNewTokenFormat(modelName)) {
        requestBody.max_completion_tokens = maxTokens;
      } else {
        requestBody.max_tokens = maxTokens;
      }
    }
    
    // Log the request details
    this.logRequest('OpenAI', formattedMessages, requestBody);
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.provider.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if error is related to unsupported parameters
        if (errorData.error && 
            errorData.error.message && 
            (errorData.error.message.includes('parameter') || 
             errorData.error.message.includes('temperature') ||
             errorData.error.message.includes('tokens'))) {
          
          console.warn('Parameter error detected. Retrying with minimal parameters:', errorData.error.message);
          
          // Create a minimal request with just model and messages
          const minimalRequest = {
            model: requestBody.model,
            messages: requestBody.messages
          };
          
          // Try again with minimal parameters
          const retryResponse = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.provider.apiKey}`
            },
            body: JSON.stringify(minimalRequest)
          });
          
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            throw new Error(`OpenAI API error (on retry): ${retryErrorData.error?.message || retryResponse.statusText}`);
          }
          
          const retryData: OpenAICompletionResponse = await retryResponse.json();
          
          if (!retryData.choices || retryData.choices.length === 0 || !retryData.choices[0].message) {
            throw new Error('No response from OpenAI API on retry');
          }
          
          // Log the response
          return this.logResponse('OpenAI', retryData);
        }
        
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data: OpenAICompletionResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('No response from OpenAI API');
      }
      
      // Log the response and return the content
      return this.logResponse('OpenAI', data);
      
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
  
  // Format messages that contain attachments
  private async formatMessagesWithAttachments(messages: Message[]): Promise<OpenAIMessage[]> {
    const formattedMessages: OpenAIMessage[] = [];
    
    for (const message of messages) {
      const role = message.role === 'user' ? 'user' : 'assistant';
      
      // Handle messages with attachments (currently focusing on the last message)
      if (message.attachments && message.attachments.length > 0) {
        // For OpenAI's multimodal models, create a content array with both text and images
        const contentParts: Array<{type: string, [key: string]: any}> = [];
        
        // Add text part if there's content
        if (message.content) {
          contentParts.push({
            type: "text",
            text: message.content
          });
        }
        
        // Process and add image attachments
        for (const attachment of message.attachments) {
          if (attachment.type === 'image') {
            const imageObj = await this.convertImageAttachment(attachment);
            contentParts.push(imageObj);
          }
          // Could add handling for other attachment types here
        }
        
        formattedMessages.push({
          role,
          content: contentParts
        });
      } else {
        // Handle text-only messages
        formattedMessages.push({
          role,
          content: message.content
        });
      }
    }
    
    return formattedMessages;
  }

  /**
   * Send messages to OpenAI and receive a structured JSON response
   */
  public async sendMessagesForStructuredResponse<T>(
    messages: Message[],
    selection: Selection | null,
    responseFormat: { type: string; schema?: Record<string, any> }
  ): Promise<T> {
    // Verify response format is valid
    if (responseFormat.type !== 'json') {
      throw new Error("OpenAI only supports 'json' as the response format type");
    }
    
    // Create a copy of messages to modify
    const messagesCopy = [...messages];
    
    // Add JSON structure instruction to the last user message
    const lastUserIndex = messagesCopy.length - 1;
    for (let i = lastUserIndex; i >= 0; i--) {
      if (messagesCopy[i].role === 'user') {
        if (responseFormat.schema) {
          messagesCopy[i] = {
            ...messagesCopy[i],
            content: `${messagesCopy[i].content}\n\nPlease provide your response as a JSON object that adheres to the following schema: ${JSON.stringify(responseFormat.schema)}`
          };
        } else {
          messagesCopy[i] = {
            ...messagesCopy[i],
            content: `${messagesCopy[i].content}\n\nPlease provide your response as a valid JSON object.`
          };
        }
        break;
      }
    }
    
    // Generate system prompt but don't add it here - it will be added in sendMessages
    // This avoids duplicating the logic for adding the system prompt
    
    // Send the modified messages to the standard completion endpoint
    const jsonResponseText = await this.sendMessages(messagesCopy, selection);
    
    try {
      // Some post-processing to handle potential markdown code blocks
      const jsonContent = jsonResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      return JSON.parse(jsonContent) as T;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse structured response from OpenAI.');
    }
  }
} 