import { Message, LLMProvider, Selection, Attachment } from '../../types';

/**
 * Base adapter interface for LLM providers
 */
export interface BaseLLMAdapter {
  /**
   * Send messages to the LLM for completion
   */
  sendMessages(
    messages: Message[], 
    selection: Selection | null
  ): Promise<string>;
  
  /**
   * Send messages to the LLM and receive a structured response
   */
  sendMessagesForStructuredResponse<T>(
    messages: Message[],
    selection: Selection | null,
    responseFormat: { type: string; schema?: Record<string, any> }
  ): Promise<T>;
}

/**
 * Abstract base class with common LLM adapter functionality
 */
export abstract class AbstractLLMAdapter implements BaseLLMAdapter {
  protected provider: LLMProvider;
  protected maxRetries: number;
  protected retryDelay: number; // in ms
  
  constructor(provider: LLMProvider, maxRetries = 3, retryDelay = 1000) {
    this.provider = provider;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
  
  /**
   * Logs the full request payload and messages being sent to the LLM
   * This helps with debugging what exactly is being sent to the model
   */
  protected logRequest(provider: string, messages: any, requestData: any): void {
    console.log('\n==================== LLM REQUEST ====================');
    console.log(`🚀 SENDING REQUEST TO: ${provider.toUpperCase()}`);
    console.log(`📝 MODEL: ${requestData.model || this.provider.defaultParams.model}`);
    console.log('📊 REQUEST PARAMETERS:', JSON.stringify({
      temperature: requestData.temperature || requestData.generationConfig?.temperature || this.provider.defaultParams.temperature,
      maxTokens: requestData.max_tokens || requestData.max_completion_tokens || requestData.generationConfig?.maxOutputTokens || this.provider.defaultParams.maxTokens,
      topP: requestData.top_p || requestData.generationConfig?.topP || this.provider.defaultParams.topP,
    }, null, 2));
    
    // Check for system prompt in various formats
    let systemPrompt = null;
    
    // For OpenAI: system prompts are in the messages array with role='system'
    if (Array.isArray(requestData.messages)) {
      const systemMessage = requestData.messages.find((msg: any) => msg.role === 'system');
      if (systemMessage) {
        systemPrompt = systemMessage.content;
      }
    }
    
    // For Claude: system prompts are in the system field
    if (requestData.system) {
      systemPrompt = requestData.system;
    }
    
    // For Gemini: system prompts are in systemInstruction
    if (requestData.systemInstruction?.parts?.[0]?.text) {
      systemPrompt = requestData.systemInstruction.parts[0].text;
    }
    
    // If we found a system prompt, log it
    if (systemPrompt) {
      console.log('🧠 SYSTEM PROMPT:', systemPrompt);
    } else {
      console.log('🧠 SYSTEM PROMPT: None specified');
    }
    
    // Full request payload (without API keys)
    const sanitizedRequest = { ...requestData };
    delete sanitizedRequest.api_key;
    delete sanitizedRequest.apiKey;
    console.log('📦 FULL REQUEST PAYLOAD:', JSON.stringify(sanitizedRequest, null, 2));
    
    // Log messages with condensed format for readability
    console.log('💬 MESSAGES:');
    const messagesToLog = Array.isArray(messages) ? messages : 
                         (requestData.messages || requestData.contents || []);
    
    messagesToLog.forEach((msg: any, index: number) => {
      const role = msg.role || 'unknown';
      let content = '';
      
      if (typeof msg.content === 'string') {
        // For text-only content
        content = msg.content.length > 100 ? 
                  `${msg.content.substring(0, 100)}... (${msg.content.length} chars)` : 
                  msg.content;
      } else if (Array.isArray(msg.content)) {
        // For multimodal content
        content = `[Multimodal content with ${msg.content.length} parts]`;
      } else if (msg.parts) {
        // For Gemini-style parts
        const textParts = msg.parts.filter((part: any) => part.text).length;
        const imageParts = msg.parts.filter((part: any) => part.inlineData).length;
        content = `[${textParts} text part(s), ${imageParts} image part(s)]`;
        
        // Show preview of first text part if available
        const firstTextPart = msg.parts.find((part: any) => part.text);
        if (firstTextPart && firstTextPart.text) {
          content += ` - "${firstTextPart.text.substring(0, 80)}${firstTextPart.text.length > 80 ? '...' : ''}"`;
        }
      }
      
      console.log(`  [${index + 1}] ${role.toUpperCase()}: ${content}`);
    });
    
    // Attempt to detect if the messages include a selection
    const hasSelection = messagesToLog.some((msg: any) => {
      if (typeof msg.content === 'string') {
        return msg.content.includes('Selected text:') || 
               msg.content.includes('Context before selection:') ||
               msg.content.includes('Context after selection:');
      } else if (msg.parts) {
        return msg.parts.some((part: any) => 
          part.text && (
            part.text.includes('Selected text:') || 
            part.text.includes('Context before selection:') ||
            part.text.includes('Context after selection:')
          )
        );
      }
      return false;
    });
    
    console.log(`🔍 INCLUDES SELECTION: ${hasSelection}`);
    console.log('======================================================\n');
  }
  
  /**
   * Logs the full response received from the LLM
   * This helps with debugging what exactly is being returned by the model
   */
  protected logResponse(provider: string, response: any): string {
    console.log('\n=================== LLM RESPONSE ===================');
    console.log(`✅ RESPONSE FROM: ${provider.toUpperCase()}`);
    
    // Log token usage if available
    if (response.usage) {
      console.log('📊 TOKEN USAGE:', JSON.stringify({
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }, null, 2));
    }
    
    // Log the full response content
    let responseContent = '';
    if (response.choices && response.choices.length > 0) {
      if (response.choices[0].message) {
        responseContent = response.choices[0].message.content;
      } else if (response.choices[0].text) {
        responseContent = response.choices[0].text;
      }
    } else if (response.content && response.content.length > 0) {
      responseContent = response.content[0].text;
    }
    
    // Display full content for debugging
    console.log('📝 FULL RESPONSE CONTENT:');
    console.log(responseContent);
    
    // Log finish reason if available
    if (response.choices && response.choices.length > 0 && response.choices[0].finish_reason) {
      console.log(`🏁 FINISH REASON: ${response.choices[0].finish_reason}`);
    }
    
    console.log('======================================================\n');
    
    return responseContent;
  }
  
  /**
   * Generate system message based on the selection and context
   */
  protected generateSystemMessage(selection: Selection | null): string {
    // Check if a custom system prompt template is provided
    if (this.provider.systemPrompt?.template) {
      return this.formatCustomSystemPrompt(selection);
    }
    
    // Default system prompt logic
    if (!selection) {
      return 'You are a helpful AI assistant.';
    }

    let systemMessage = 'You are a helpful AI assistant. ';
    systemMessage += 'The user has selected some text from a document and wants to discuss it with you. ';
    
    if (selection.contextBefore || selection.contextAfter) {
      systemMessage += 'I will provide the selected text along with some context around it. ';
    }
    
    if (selection.fullDocument) {
      systemMessage += 'I will also provide the full document for additional context if needed. ';
    }
    
    if (selection.url) {
      systemMessage += `The text comes from: ${selection.url}. `;
    }
    
    systemMessage += 'Please answer questions about this content in a helpful, accurate, and concise manner.';
    
    return systemMessage;
  }
  
  /**
   * Format custom system prompt using the provided template
   */
  protected formatCustomSystemPrompt(selection: Selection | null): string {
    // Get the template and configuration
    const { template } = this.provider.systemPrompt!;
    const useSearch = this.provider.systemPrompt?.useSearch || false;
    const contextLevels = this.provider.systemPrompt?.contextLevels || {};
    
    // Replace template variables
    let formattedPrompt = template;
    
    // Replace useSearch variable
    formattedPrompt = formattedPrompt.replace(/\${useSearch\s?\?\s?`([^`]*)`\s?:\s?'([^']*)'}/g, (_, ifTrue, ifFalse) => {
      return useSearch ? ifTrue : ifFalse;
    });
    
    // Handle simple conditional sections with variables
    for (const [level, enabled] of Object.entries(contextLevels)) {
      const regex = new RegExp(`\\$\\{${level}\\s?\\?\\s?\`([^\`]*)\`\\s?:\\s?'([^']*)'\\}`, 'g');
      formattedPrompt = formattedPrompt.replace(regex, (_, ifTrue, ifFalse) => {
        return enabled ? ifTrue : ifFalse;
      });
    }
    
    // Add document-specific information if selection exists
    if (selection) {
      // Add selection info
      formattedPrompt += '\n\n--- Selection Information ---';
      if (selection.url) {
        formattedPrompt += `\nSource: ${selection.url}`;
      }
      if (selection.location) {
        formattedPrompt += `\nLocation: ${selection.location}`;
      }
      formattedPrompt += `\nSelection Length: ${selection.text.length} characters`;
      
      // Add context info
      if (selection.contextBefore || selection.contextAfter) {
        formattedPrompt += `\nContext: Available ${selection.contextBefore ? 'before' : ''}${selection.contextBefore && selection.contextAfter ? ' and ' : ''}${selection.contextAfter ? 'after' : ''} selection`;
      }
      
      // Add full document info
      if (selection.fullDocument) {
        formattedPrompt += `\nFull Document: Available (${selection.fullDocument.length} characters)`;
      }
    }
    
    return formattedPrompt;
  }
  
  /**
   * Format selected text with its context
   */
  protected formatSelectionWithContext(selection: Selection): string {
    let formattedText = '';
    
    // Log the selection context for debugging
    console.log('%c📝 FORMATTING SELECTION CONTEXT', 'background: #3F51B5; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('Context before length:', selection.contextBefore?.length || 0);
    console.log('Context after length:', selection.contextAfter?.length || 0);
    console.log('Full document length:', selection.fullDocument?.length || 0);
    
    if (selection.contextBefore) {
      formattedText += `Context before selection: "${selection.contextBefore}"\n\n`;
    }
    
    formattedText += `Selected text: "${selection.text}"\n\n`;
    
    if (selection.contextAfter) {
      formattedText += `Context after selection: "${selection.contextAfter}"`;
    }
    
    // Only add full document if it exists and differs from the combined context
    if (selection.fullDocument && 
        selection.fullDocument.length > 0 && 
        (selection.fullDocument !== selection.contextBefore + selection.text + selection.contextAfter)) {
      formattedText += `\n\nFull document: "${selection.fullDocument.substring(0, 1000)}${selection.fullDocument.length > 1000 ? '...' : ''}"`;
    }
    
    // Log the formatted result
    console.log('Formatted text length:', formattedText.length);
    console.log('Formatted text includes context before:', formattedText.includes('Context before selection'));
    console.log('Formatted text includes context after:', formattedText.includes('Context after selection'));
    console.log('Formatted text includes full document:', formattedText.includes('Full document:'));
    
    return formattedText;
  }
  
  /**
   * Converts an image attachment to the format required by the LLM provider.
   * This should be overridden by specific provider implementations.
   */
  protected async convertImageAttachment(attachment: Attachment): Promise<any> {
    if (attachment.type !== 'image') {
      throw new Error(`Unsupported attachment type: ${attachment.type}`);
    }
    
    // Default implementation converts to base64
    if (attachment.data instanceof Blob) {
      return this.blobToBase64(attachment.data);
    } else if (attachment.url) {
      return attachment.url;
    }
    
    throw new Error('Image attachment must contain either data or url');
  }
  
  /**
   * Converts a Blob to a base64 data URL
   */
  protected blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Optimizes an image for LLM processing
   * Resizes large images to reduce token usage
   */
  protected async optimizeImage(imageData: Blob, maxWidth = 800, maxHeight = 800): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src); // Clean up the object URL
        
        // Check if resizing is needed
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve(imageData); // No resizing needed
          return;
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        let newWidth = img.width;
        let newHeight = img.height;
        
        if (newWidth > maxWidth) {
          newHeight = Math.floor(newHeight * (maxWidth / newWidth));
          newWidth = maxWidth;
        }
        
        if (newHeight > maxHeight) {
          newWidth = Math.floor(newWidth * (maxHeight / newHeight));
          newHeight = maxHeight;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and resize image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          imageData.type || 'image/jpeg',
          0.9 // Quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      
      // Create object URL from blob
      img.src = URL.createObjectURL(imageData);
    });
  }
  
  /**
   * Process attachments for sending to the LLM
   * Handles multiple attachments and different attachment types
   */
  protected async processAttachments(attachments: Attachment[]): Promise<any[]> {
    const processedAttachments = [];
    
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        // Optimize image if it's a blob
        if (attachment.data instanceof Blob) {
          const optimizedBlob = await this.optimizeImage(attachment.data);
          attachment.data = optimizedBlob;
        }
        
        const processedImage = await this.convertImageAttachment(attachment);
        processedAttachments.push(processedImage);
      }
      // Add handlers for other attachment types if needed
    }
    
    return processedAttachments;
  }
  
  /**
   * Send messages to the LLM for completion
   * Must be implemented by derived classes
   */
  abstract sendMessages(
    messages: Message[], 
    selection: Selection | null
  ): Promise<string>;
  
  /**
   * Send messages to the LLM and receive a structured response
   * Must be implemented by derived classes
   */
  abstract sendMessagesForStructuredResponse<T>(
    messages: Message[],
    selection: Selection | null,
    responseFormat: { type: string; schema?: Record<string, any> }
  ): Promise<T>;
} 