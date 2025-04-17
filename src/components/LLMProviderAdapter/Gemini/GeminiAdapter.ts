import { Message, LLMProvider, Selection, Attachment } from '../../../types';
import { AbstractLLMAdapter } from '../BaseAdapter';

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

interface GeminiCompletionRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiCompletionResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export class GeminiAdapter extends AbstractLLMAdapter {
  private apiEndpoint: string;
  
  constructor(provider: LLMProvider) {
    super(provider);
    this.apiEndpoint = provider.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
  }
  
  // Override for Gemini-specific image handling
  protected async convertImageAttachment(attachment: Attachment): Promise<GeminiPart> {
    if (attachment.type !== 'image') {
      throw new Error(`Unsupported attachment type: ${attachment.type}`);
    }
    
    let base64Data: string;
    let mimeType: string = attachment.mimeType || 'image/jpeg';
    
    if (attachment.data instanceof Blob) {
      // Convert blob to base64 string (without the data URL prefix)
      const dataUrl = await this.blobToBase64(attachment.data);
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      base64Data = dataUrl.split(',')[1];
      mimeType = attachment.data.type || mimeType;
    } else if (attachment.url && attachment.url.startsWith('data:')) {
      // Extract base64 data from data URL
      base64Data = attachment.url.split(',')[1];
      // Extract MIME type from data URL
      const mimeMatch = attachment.url.match(/data:([^;]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    } else {
      throw new Error('Gemini requires image data as base64. URL references are not supported.');
    }
    
    // Return in Gemini's expected format
    return {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };
  }
  
  private convertMessagesToGeminiFormat(messages: Message[]): GeminiContent[] {
    return messages.map(message => {
      const role = message.role === 'user' ? 'user' : 'model';
      
      return {
        role,
        parts: [{ text: message.content }]
      };
    });
  }
  
  public async sendMessages(
    messages: Message[], 
    selection: Selection | null
  ): Promise<string> {
    // Process selection if present
    let processedMessages = [...messages];
    
    // If we have a selection, add it to the first user message
    if (selection) {
      const firstUserIndex = processedMessages.findIndex(m => m.role === 'user');
      if (firstUserIndex >= 0) {
        // Format the selection with context
        const selectionText = this.formatSelectionWithContext(selection);
        
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
    
    let formattedContents: GeminiContent[];
    
    if (hasAttachments) {
      // Handle messages with attachments
      formattedContents = await this.formatMessagesWithAttachments(processedMessages);
    } else {
      // Standard text-only messages
      formattedContents = this.convertMessagesToGeminiFormat(processedMessages);
    }
    
    const modelName = this.provider.defaultParams.model;
    const fullUrl = `${this.apiEndpoint}/${modelName}:generateContent?key=${this.provider.apiKey}`;
    
    // Log for debugging
    console.log("📷 Gemini request contents:", 
      JSON.stringify({
        modelName,
        hasAttachments,
        messagesCount: processedMessages.length,
        attachmentsCount: processedMessages.reduce((count, msg) => 
          count + (msg.attachments?.length || 0), 0)
      })
    );
    
    const requestBody: GeminiCompletionRequest = {
      contents: formattedContents,
      generationConfig: {
        temperature: this.provider.defaultParams.temperature,
        maxOutputTokens: this.provider.defaultParams.maxTokens,
        topP: this.provider.defaultParams.topP,
      }
    };
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data: GeminiCompletionResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  
  // Format messages that contain attachments
  private async formatMessagesWithAttachments(messages: Message[]): Promise<GeminiContent[]> {
    const formattedContents: GeminiContent[] = [];
    
    for (const message of messages) {
      const role = message.role === 'user' ? 'user' : 'model';
      
      // Handle messages with attachments (currently focusing on the last message)
      if (message.attachments && message.attachments.length > 0) {
        const parts: GeminiPart[] = [];
        
        // Add text part if there's content
        if (message.content) {
          parts.push({ text: message.content });
        }
        
        // Process and add image attachments
        for (const attachment of message.attachments) {
          if (attachment.type === 'image') {
            const imagePart = await this.convertImageAttachment(attachment);
            parts.push(imagePart);
          }
          // Could add handling for other attachment types here
        }
        
        formattedContents.push({
          role,
          parts
        });
      } else {
        // Handle text-only messages
        formattedContents.push({
          role,
          parts: [{ text: message.content }]
        });
      }
    }
    
    return formattedContents;
  }
  
  /**
   * Send messages to Gemini and receive a structured JSON response
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
    
    // Create a copy of messages to modify
    const messagesCopy = [...messages];
    
    // If we have a selection, add it to the last user message
    if (selection) {
      const lastUserMessageIndex = messagesCopy.findIndex(m => m.role === 'user');
      if (lastUserMessageIndex >= 0) {
        // Format the selection with context
        const selectionText = this.formatSelectionWithContext(selection);
        
        // Add to the existing message
        messagesCopy[lastUserMessageIndex] = {
          ...messagesCopy[lastUserMessageIndex],
          content: `${selectionText}\n\n${messagesCopy[lastUserMessageIndex].content}`
        };
      }
    }
    
    // Add JSON structure instruction to the last user message
    const lastUserMessageIndex = messagesCopy.length - 1;
    for (let i = lastUserMessageIndex; i >= 0; i--) {
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
    
    // Send the modified messages to the standard completion endpoint
    const jsonResponseText = await this.sendMessages(messagesCopy, null);
    
    try {
      // Some post-processing to handle potential markdown code blocks
      const jsonContent = jsonResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      return JSON.parse(jsonContent) as T;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse structured response from Gemini.');
    }
  }
} 