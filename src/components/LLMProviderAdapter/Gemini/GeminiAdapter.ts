import { Message, LLMProvider, Selection, Attachment } from '../../../types';
import { AbstractLLMAdapter } from '../BaseAdapter';
import { AttachmentWithMime } from '../../../types/attachment';

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
  systemInstruction?: {
    parts: Array<{
      text: string
    }>
  };
}

// Update to match the actual API field names
interface GeminiApiRequest {
  contents: GeminiContent[];
  generation_config?: {
    temperature?: number;
    max_output_tokens?: number;
    top_p?: number;
    top_k?: number;
  };
  system_instruction?: {
    parts: Array<{
      text: string
    }>
  };
}

/**
 * Interface representing the structure of a Gemini API completion response
 */
interface GeminiCompletionResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        [key: string]: any;
      }>;
      role?: string;
      [key: string]: any;
    };
    finishReason?: string;
    index?: number;
    safetyRatings?: any[];
    [key: string]: any;
  }>;
  promptFeedback?: any;
  [key: string]: any;
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
    
    // Filter out any messages with empty text content
    formattedContents = formattedContents.filter(content => 
      content.parts.some(part => part.text && part.text.trim() !== '')
    );
    
    // If we have no valid messages, add a default user message
    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: "Hello, can you help me?" }]
      });
    }
    
    const modelName = this.provider.defaultParams.model;
    const fullUrl = `${this.apiEndpoint}/${modelName}:generateContent?key=${this.provider.apiKey}`;
    
    // Generate system prompt based on selection
    const systemPrompt = this.generateSystemMessage(selection);
    
    // Create internal request body with our naming convention
    const requestBody: GeminiCompletionRequest = {
      contents: formattedContents,
      generationConfig: {
        temperature: this.provider.defaultParams.temperature,
        maxOutputTokens: this.provider.defaultParams.maxTokens,
        topP: this.provider.defaultParams.topP,
      }
    };
    
    // Add system instruction if available and model supports it
    // Gemini 1.5 and 2.0 support systemInstruction
    if (modelName.includes('gemini-1.5') || modelName.includes('gemini-2.0')) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    } else {
      // For older models, prepend system prompt as a user message
      const hasSystemMessage = formattedContents.some(msg => 
        msg.parts.some(part => part.text?.includes(systemPrompt))
      );
      
      if (!hasSystemMessage && systemPrompt) {
        formattedContents.unshift({
          role: 'user',
          parts: [{ text: `System: ${systemPrompt}` }]
        });
        requestBody.contents = formattedContents;
      }
    }
    
    // Convert to API request format with snake_case field names
    const apiRequest: GeminiApiRequest = {
      contents: requestBody.contents,
      generation_config: {
        temperature: requestBody.generationConfig?.temperature,
        max_output_tokens: requestBody.generationConfig?.maxOutputTokens,
        top_p: requestBody.generationConfig?.topP,
        top_k: requestBody.generationConfig?.topK
      }
    };
    
    // Convert system instruction if present
    if (requestBody.systemInstruction) {
      apiRequest.system_instruction = {
        parts: requestBody.systemInstruction.parts
      };
    }
    
    // Log the request details - log the internal format for consistency
    this.logRequest('Gemini', formattedContents, requestBody);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data: GeminiCompletionResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }
      
      // Log the response and return the content
      return this.logResponse('Gemini', data);
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
    let jsonInstructionAdded = false;
    
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
        jsonInstructionAdded = true;
        break;
      }
    }
    
    // If no user message was found to add the JSON instruction to,
    // add a new user message with the JSON instruction
    if (!jsonInstructionAdded) {
      const instruction = responseFormat.schema 
        ? `Please provide a JSON object that adheres to the following schema: ${JSON.stringify(responseFormat.schema)}`
        : `Please provide a valid JSON object.`;
        
      messagesCopy.push({
        id: `json-instruction-${Date.now()}`,
        role: 'user',
        content: instruction,
        timestamp: Date.now()
      });
    }
    
    // Log the structured request (using the internal logging format)
    this.logRequest('Gemini (Structured JSON)', messagesCopy, { 
      messages: messagesCopy, 
      responseFormat 
    });
    
    // Send the modified messages to the standard completion endpoint
    // Note: We're passing selection as null here since we've already processed it above
    const jsonResponseText = await this.sendMessages(messagesCopy, null);
    
    try {
      // Some post-processing to handle potential markdown code blocks
      const jsonContent = jsonResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      const parsedResponse = JSON.parse(jsonContent) as T;
      
      // Log the structured response
      console.log('\n=================== STRUCTURED RESPONSE ===================');
      console.log(`✅ STRUCTURED JSON FROM: GEMINI`);
      console.log('📝 PARSED JSON RESPONSE:');
      console.log(JSON.stringify(parsedResponse, null, 2));
      console.log('===========================================================\n');
      
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse structured response from Gemini.');
    }
  }
  
  /**
   * Extract the text content from the Gemini API response
   * This is a helper method to properly parse the response structure
   */
  protected extractResponseContent(response: GeminiCompletionResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }
    
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('No content parts in Gemini response candidate');
    }
    
    // Extract text from the first text part
    const textPart = candidate.content.parts.find(part => part.text !== undefined);
    if (!textPart || textPart.text === undefined) {
      throw new Error('No text content found in Gemini response');
    }
    
    return textPart.text;
  }
  
  /**
   * Override the logResponse method to correctly extract content from Gemini responses
   */
  protected logResponse(provider: string, response: any): string {
    console.log('\n=================== LLM RESPONSE ===================');
    console.log(`✅ RESPONSE FROM: ${provider.toUpperCase()}`);
    
    // Extract the response content from the Gemini-specific structure
    let responseContent = '';
    try {
      responseContent = this.extractResponseContent(response);
    } catch (error) {
      console.error('Error extracting response content:', error);
      console.log('📝 RAW RESPONSE:', JSON.stringify(response, null, 2));
      responseContent = 'Error extracting response content. See console for raw response.';
    }
    
    // Display full content for debugging
    console.log('📝 FULL RESPONSE CONTENT:');
    console.log(responseContent);
    
    // Log finish reason if available
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason) {
      console.log(`🏁 FINISH REASON: ${response.candidates[0].finishReason}`);
    }
    
    console.log('======================================================\n');
    
    return responseContent;
  }
} 