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
   * Generate system message based on the selection and context
   */
  protected generateSystemMessage(selection: Selection | null): string {
    if (!selection) {
      return 'You are a helpful AI assistant.';
    }

    let systemMessage = 'You are a helpful AI assistant. ';
    systemMessage += 'The user has selected some text from a document and wants to discuss it with you. ';
    
    if (selection.contextBefore || selection.contextAfter) {
      systemMessage += 'I will provide the selected text along with some context around it. ';
    }
    
    if (selection.url) {
      systemMessage += `The text comes from: ${selection.url}. `;
    }
    
    systemMessage += 'Please answer questions about this content in a helpful, accurate, and concise manner.';
    
    return systemMessage;
  }
  
  /**
   * Format selected text with its context
   */
  protected formatSelectionWithContext(selection: Selection): string {
    let formattedText = '';
    
    if (selection.contextBefore) {
      formattedText += `Context before selection: "${selection.contextBefore}"\n\n`;
    }
    
    formattedText += `Selected text: "${selection.text}"\n\n`;
    
    if (selection.contextAfter) {
      formattedText += `Context after selection: "${selection.contextAfter}"`;
    }
    
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