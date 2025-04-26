import React from 'react';
import styled, { DefaultTheme } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType, Selection, Attachment } from '../../types';

// Extend MessageType for our component since the current type definition may not include attachments
interface ExtendedMessageType extends MessageType {
  attachments?: Attachment[];
}

interface MessageProps {
  message: ExtendedMessageType;
  showTimestamp?: boolean;
  isUser?: boolean;
}

type StyledProps = {
  theme: DefaultTheme;
  isUser: boolean;
};

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  max-width: 85%;
  align-self: ${(props: StyledProps) => props.isUser ? 'flex-end' : 'flex-start'};
  background-color: ${(props: StyledProps) => props.isUser ? props.theme.colors.primary + '20' : props.theme.colors.backgroundLight};
  border-radius: ${(props: StyledProps) => props.theme.borderRadius.medium};
  padding: ${(props: StyledProps) => props.theme.spacing.md};
  border: 1px solid ${(props: StyledProps) => props.isUser ? props.theme.colors.primary + '30' : props.theme.colors.border};
`;

const MessageContent = styled.div`
  font-size: ${(props: { theme: DefaultTheme }) => props.theme.fontSizes.medium};
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.text};
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm};
`;

const Timestamp = styled.span`
  font-size: ${(props: { theme: DefaultTheme }) => props.theme.fontSizes.small};
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.textSecondary};
`;

const MessageRole = styled.span`
  font-size: ${(props: { theme: DefaultTheme }) => props.theme.fontSizes.small};
  font-weight: 600;
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.textSecondary};
`;

const AttachmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm};
  margin-bottom: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm};
`;

const ImageAttachment = styled.div`
  width: 200px;
  border-radius: ${(props: { theme: DefaultTheme }) => props.theme.borderRadius.small};
  overflow: hidden;
  border: 1px solid ${(props: { theme: DefaultTheme }) => props.theme.colors.border};
`;

const AttachmentImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${(props: StyledProps) => props.isUser 
    ? props.theme.colors.primary + '40'
    : props.theme.colors.surface};
  color: ${(props: StyledProps) => props.isUser 
    ? props.theme.colors.textOnPrimary
    : props.theme.colors.text};
  padding: ${(props: StyledProps) => props.theme.spacing.sm} ${(props: StyledProps) => props.theme.spacing.md};
  border-radius: 18px;
  max-width: 80%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.5;
  font-size: ${(props: StyledProps) => props.theme.fontSizes.medium};
  letter-spacing: 0.01em;
  
  ${(props: StyledProps) => props.isUser 
    ? `border-bottom-right-radius: 4px;` 
    : `border-bottom-left-radius: 4px;`}
  
  /* Format markdown-style content */
  & ul, & ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  & li {
    margin-bottom: 0.25em;
  }
  
  & p {
    margin: 0.5em 0;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Code formatting */
  & pre {
    background-color: ${(props: StyledProps) => props.isUser 
      ? 'rgba(0, 0, 0, 0.2)' 
      : props.theme.colors.backgroundLight};
    padding: 0.75em;
    border-radius: 6px;
    margin: 0.5em 0;
    overflow-x: auto;
    color: ${(props: StyledProps) => props.isUser 
      ? props.theme.colors.textOnPrimary 
      : props.theme.colors.text};
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  & code {
    background-color: ${(props: StyledProps) => props.isUser 
      ? 'rgba(0, 0, 0, 0.2)' 
      : props.theme.colors.backgroundLight};
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
`;

const SelectionContext = styled.div`
  margin-top: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm};
  padding: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm} ${(props: { theme: DefaultTheme }) => props.theme.spacing.md};
  background-color: ${(props: { theme: DefaultTheme }) => props.theme.colors.backgroundLight};
  border-left: 4px solid ${(props: { theme: DefaultTheme }) => props.theme.colors.primary};
  border-radius: ${(props: { theme: DefaultTheme }) => props.theme.borderRadius.small};
  font-size: ${(props: { theme: DefaultTheme }) => props.theme.fontSizes.small};
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.text};
  max-width: 90%;
  max-height: 200px;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: ${(props: { theme: DefaultTheme }) => props.theme.spacing.sm};
  align-self: flex-start;
`;

const SelectionHighlight = styled.span`
  font-weight: 600;
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.primary};
  background-color: ${(props: { theme: DefaultTheme }) => props.theme.colors.primaryLight}40; // 25% opacity
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin: 3px 0;
`;

const SelectionLabel = styled.div`
  font-size: ${(props: { theme: DefaultTheme }) => props.theme.fontSizes.xsmall};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(props: { theme: DefaultTheme }) => props.theme.colors.primary};
  margin-bottom: ${(props: { theme: DefaultTheme }) => props.theme.spacing.xs};
  font-weight: 600;
`;

// Styled components for markdown elements
const MarkdownImage = styled.img`
  max-width: 100%;
  border-radius: ${(props: { theme: DefaultTheme }) => props.theme.borderRadius.small};
  margin: 8px 0;
  border: 1px solid ${(props: { theme: DefaultTheme }) => props.theme.colors.border};
`;

// Fix the typing by explicitly defining the props interface
interface MarkdownCodeProps {
  isUser: boolean;
  theme: DefaultTheme;
    }
    
const MarkdownPre = styled.pre<{ isUser: boolean }>`
  background-color: ${(props) => props.isUser 
    ? 'rgba(0, 0, 0, 0.2)' 
    : props.theme.colors.backgroundLight};
  padding: 0.75em;
  border-radius: 6px;
  margin: 0.5em 0;
  overflow-x: auto;
  color: ${(props) => props.isUser 
    ? props.theme.colors.textOnPrimary 
    : props.theme.colors.text};
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
`;

const MarkdownCode = styled.code<{ isUser: boolean }>`
  background-color: ${(props) => props.isUser 
    ? 'rgba(0, 0, 0, 0.2)' 
    : props.theme.colors.backgroundLight};
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
`;

export const Message: React.FC<MessageProps> = ({ message, showTimestamp = false, isUser: isUserProp }) => {
  const isUser = isUserProp !== undefined ? isUserProp : message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Function to handle image click (for expanding later)
  const handleImageClick = (attachment: Attachment) => {
    console.log('Image clicked:', attachment);
    // Here you could implement a lightbox or other image viewing functionality
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };
  
  // Custom markdown components
  const markdownComponents = {
    img: ({ node, ...props }: any) => (
      <MarkdownImage {...props} alt={props.alt || 'Image'} />
    ),
    pre: ({ node, children, ...props }: any) => (
      <MarkdownPre isUser={isUser} {...props}>{children}</MarkdownPre>
    ),
    code: ({ node, inline, children, ...props }: any) => {
      return inline ? 
        <MarkdownCode isUser={isUser} {...props}>{children}</MarkdownCode> : 
        <span {...props}>{children}</span>;
    }
  };
  
  // Skip system messages that are just for selection notification
  if (message.role === 'system' && message.selection) {
    return null;
  }

  // Format selection context
  const formatSelectionContext = (selection: Selection) => {
    // Safely check if attachments exist with explicit type checking
    const attachments = selection.attachments || [];
    const hasAttachments = attachments.length > 0;
    
    // Debug log
    if (hasAttachments) {
      console.log('Message component rendering attachments:', attachments.length);
    }
    
    return (
      <>
        <SelectionLabel>Selected Text:</SelectionLabel>
        {selection.contextBefore && (
          <div style={{ 
            marginBottom: '8px', 
            fontSize: '0.95em', 
            opacity: 0.85,
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {selection.contextBefore}
            </ReactMarkdown>
          </div>
        )}
        <SelectionHighlight>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {selection.text}
          </ReactMarkdown>
        </SelectionHighlight>
        {selection.contextAfter && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.95em', 
            opacity: 0.85,
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {selection.contextAfter}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Enhanced image display */}
        {hasAttachments && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ 
              fontSize: '0.9em', 
              marginBottom: '8px', 
              fontWeight: 500, 
              color: '#2563eb'
            }}>
              Selected Images ({attachments.length}):
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px'
            }}>
              {attachments.map((attachment, index) => {
                if (attachment.type === 'image' && attachment.url) {
                  return (
                    <div key={attachment.id || index} style={{ 
                      width: '120px', 
                      height: '120px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '2px solid #3b82f6',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      <img 
                        src={attachment.url} 
                        alt={attachment.name || `Image ${index+1}`} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <MessageContainer isUser={isUser}>
      {message.attachments && message.attachments.length > 0 && (
        <AttachmentsContainer>
          {message.attachments.map((attachment: Attachment) => (
            attachment.type === 'image' && (
              <ImageAttachment key={attachment.id}>
                <AttachmentImage 
                  src={attachment.url} 
                  alt={attachment.name}
                  onClick={() => handleImageClick(attachment)}
                />
              </ImageAttachment>
            )
          ))}
        </AttachmentsContainer>
      )}
      <MessageBubble isUser={isUser}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {message.content}
        </ReactMarkdown>
      </MessageBubble>
      
      {message.selection && isUser && (
        <SelectionContext>
          {formatSelectionContext(message.selection)}
        </SelectionContext>
      )}
      
      <MessageMeta>
        <MessageRole>
          {isUser ? 'You' : 'Assistant'}
        </MessageRole>
        {showTimestamp && (
          <Timestamp>{formattedTime}</Timestamp>
        )}
      </MessageMeta>
    </MessageContainer>
  );
}; 