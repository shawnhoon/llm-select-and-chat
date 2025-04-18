import { Attachment } from '../types';

/**
 * Extends the basic Attachment interface with a guaranteed MIME type
 * Used for attachments being processed for LLM integration where 
 * MIME type is required for proper handling
 */
export interface AttachmentWithMime extends Attachment {
  mimeType: string; // Making mimeType required instead of optional
} 