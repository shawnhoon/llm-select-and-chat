import { Selection, Attachment, Message, LLMProvider } from '../../types';
// import { optimizeImageAttachment } from '../../utils/imageUtils'; // Commented out: File not found
import { AttachmentWithMime } from '../../types/attachment';

// Define types based on LLMProvider structure
type LLMRequestParams = LLMProvider['defaultParams'];
type SystemPromptParams = LLMProvider['systemPrompt'];

/**
 * Base interface for all LLM adapters
 */
export interface BaseLLMAdapter {
  /**
   * Provider configuration
   */
  provider: LLMProvider; // Use LLMProvider type

  /**
   * Format a selection with context for the LLM
   */
  formatSelectionWithContext(selection: Selection): string;

  /**
   * Send messages to the LLM and get a response
   */
  sendMessages(
    messages: Message[],
    selection?: Selection | null,
    params?: LLMRequestParams
  ): Promise<string>;

  /**
   * Send messages to the LLM and get a structured response according to the provided schema
   */
  sendMessagesForStructuredResponse<T>(
    messages: Message[],
    schema: Record<string, unknown>,
    selection?: Selection | null,
    params?: LLMRequestParams
  ): Promise<T>;
}

/**
 * Abstract base class for LLM adapters
 * Implements common functionality shared across all LLM adapters
 */
export abstract class AbstractLLMAdapter implements BaseLLMAdapter {
  provider: LLMProvider; // Use LLMProvider type
  maxRetries = 3;
  retryDelay = 1000;

  constructor(provider: LLMProvider) { // Use LLMProvider type
    this.provider = provider;
  }
  
  /**
   * Process attachments into a format suitable for the specific LLM provider
   * @param attachments Array of attachments to process
   * @returns Processed attachments
   */
  protected async processAttachments(attachments: Attachment[]): Promise<(AttachmentWithMime | null)[]> {
    const attachmentsToProcess = attachments.filter(a => a && a.data);
    console.log(`Processing ${attachmentsToProcess.length} attachments`);
    
    const processedAttachments = await Promise.all(
      attachmentsToProcess.map(async attachment => {
        if (attachment.type === 'image') {
          // try {
          //   // const optimizedImage = await optimizeImageAttachment(attachment); // Commented out: Missing import
          //   // return optimizedImage;
          // } catch (error) {
          //   console.error('Error optimizing image:', error);
          //   return null;
          // }
          // For now, return the image attachment as is without optimization
          return {
            ...attachment,
            mimeType: attachment.mimeType || 'image/jpeg' // Provide a default mime type if missing
          } as AttachmentWithMime;
        } else {
          return {
            ...attachment,
            mimeType: attachment.mimeType || 'application/octet-stream'
          } as AttachmentWithMime;
        }
      })
    );
    
    return processedAttachments.filter(a => a !== null);
  }

  /**
   * Format selection with context for the LLM
   * @param selection The selection object containing text and optional context
   * @returns Formatted string with selection and context
   */
  formatSelectionWithContext(selection: Selection): string {
    if (!selection) {
      console.log('formatSelectionWithContext: No selection provided');
      return '';
    }

    // Log detailed info about the selection for debugging
    console.log(`📝 Formatting selection context. Selection text length: ${selection.text?.length || 0}`);
    console.log(`📝 Context before exists: ${!!selection.contextBefore}, length: ${selection.contextBefore?.length || 0}`);
    console.log(`📝 Context after exists: ${!!selection.contextAfter}, length: ${selection.contextAfter?.length || 0}`);
    
    if (selection.contextBefore || selection.contextAfter) {
      const beforeContext = selection.contextBefore ? `Context before selection:\n${selection.contextBefore}\n\n` : '';
      const afterContext = selection.contextAfter ? `\n\nContext after selection:\n${selection.contextAfter}` : '';
      return `${beforeContext}Selected text:\n${selection.text}${afterContext}`;
    }
    
    return selection.text || '';
  }

  /**
   * Generate a system message based on selection and optional parameters
   * @param selection The selection object
   * @param params Optional parameters for system prompt customization
   * @returns System message string
   */
  protected generateSystemMessage(
    selection?: Selection | null,
    params?: { systemPrompt?: string } // Adjusted type for params
  ): string {
    let systemMessage = this.provider.systemPrompt?.template || ''; // Use provider.systemPrompt.template
    
    if (params?.systemPrompt) {
      systemMessage = params.systemPrompt;
    }
    
    // If there's a selection, append information about it
    if (selection) {
      const selectionContext = this.formatSelectionWithContext(selection);
      if (selectionContext) {
        systemMessage += `\n\nUser has selected the following text:\n${selectionContext}`;
        
        // If URL is available, add it for context
        if (selection.url) {
          systemMessage += `\n\nSelection source: ${selection.url}`;
        }
      }
    }
    
    return systemMessage;
  }

  /**
   * Helper method to log request details for debugging
   * @param request The request object to log
   */
  protected logRequest(request: any): void {
    try {
      const formatted = JSON.stringify(request, null, 2);
      console.log(`🔄 Request:`, formatted);
    } catch (error) {
      console.log(`🔄 Request: [Could not stringify request]`, request);
    }
  }

  /**
   * Helper method to log response details for debugging
   * @param response The response object to log
   */
  protected logResponse(response: any): void {
    try {
      const formatted = JSON.stringify(response, null, 2);
      console.log(`✅ Response:`, formatted);
    } catch (error) {
      console.log(`✅ Response: [Could not stringify response]`, response);
    }
  }

  /**
   * Abstract method for sending messages to the LLM
   * Must be implemented by concrete adapter subclasses
   */
  abstract sendMessages(
    messages: Message[],
    selection?: Selection | null,
    params?: LLMRequestParams // Use the defined type alias
  ): Promise<string>;

  /**
   * Abstract method for sending messages to get structured responses
   * Must be implemented by concrete adapter subclasses
   */
  abstract sendMessagesForStructuredResponse<T>(
    messages: Message[],
    schema: Record<string, unknown>,
    selection?: Selection | null,
    params?: LLMRequestParams // Use the defined type alias
  ): Promise<T>;
} 