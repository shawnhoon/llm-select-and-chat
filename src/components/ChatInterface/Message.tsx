import React, { useState } from 'react';
import styled from 'styled-components';
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

// Modified to include spacing for sender indicator and increase vertical spacing
const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  align-items: flex-start;
  max-width: 85%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: var(--chat-spacing-md); /* Increased for better readability */
  gap: var(--chat-sender-indicator-spacing);
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: calc(-1 * var(--chat-spacing-sm)); /* Position divider further down */
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--chat-color-divider);
    pointer-events: none;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

const MessageContent = styled.div`
  font-size: var(--chat-font-size-md);
  color: var(--chat-color-text-primary);
  line-height: var(--chat-line-height-normal);
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--chat-spacing-xs);
  padding: 0 var(--chat-spacing-xs);
`;

// Make timestamp more subtle
const Timestamp = styled.span`
  font-size: var(--chat-font-size-xs);
  color: var(--chat-color-text-tertiary);
  opacity: 0.8;
`;

const MessageRole = styled.span`
  font-size: var(--chat-font-size-xs);
  color: var(--chat-color-text-secondary);
  font-weight: var(--chat-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AttachmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--chat-spacing-sm);
  margin-bottom: var(--chat-spacing-sm);
`;

const ImageAttachment = styled.div`
  width: 200px;
  border-radius: var(--chat-border-radius-sm);
  overflow: hidden;
  border: 1px solid var(--chat-color-border);
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

// Enhanced sender indicator with more distinct colors and clearer text
const SenderIndicator = styled.div<{ isUser: boolean; role: string; className?: string }>`
  width: var(--chat-sender-indicator-size);
  height: var(--chat-sender-indicator-size);
  min-width: var(--chat-sender-indicator-size);
  border-radius: var(--chat-border-radius-circle);
  background-color: ${props => {
    if (props.role === 'system') return 'var(--chat-sender-indicator-system)';
    return props.isUser ? 'var(--chat-sender-indicator-user)' : 'var(--chat-sender-indicator-assistant)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--chat-color-text-on-primary);
  font-size: var(--chat-font-size-xs);
  font-weight: var(--chat-font-weight-bold);
  text-transform: uppercase;
  margin-top: 4px; // Add some top offset to align with message
  box-shadow: var(--chat-shadow-sm);
  transition: transform var(--chat-transition-duration-fast) ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

// Enhanced message bubble with more distinct styling between user and assistant
const MessageBubble = styled.div<{ isUser: boolean; role: string; className?: string }>`
  padding: var(--chat-spacing-sm);
  color: var(--chat-color-text-primary);
  box-shadow: var(--chat-shadow-sm);
  transition: box-shadow var(--chat-transition-duration-fast) ease, 
              background-color var(--chat-transition-duration-fast) ease;
  
  ${props => {
    if (props.role === 'system') {
      return `
        background-color: var(--chat-color-system-message);
        border-radius: var(--chat-border-radius-lg);
        border: 1px solid var(--chat-color-border);
      `;
    } else if (props.isUser) {
      return `
        background-color: var(--chat-color-user-message);
        border-radius: var(--chat-border-radius-lg);
        border-bottom-right-radius: var(--chat-border-radius-xs);
        border: 1px solid var(--chat-color-primary-light);
      `;
    } else {
      return `
        background-color: var(--chat-color-assistant-message);
        border-radius: var(--chat-border-radius-lg);
        border-bottom-left-radius: var(--chat-border-radius-xs);
        border-left: 2px solid var(--chat-color-assistant-border);
        border: 1px solid var(--chat-color-border);
      `;
    }
  }}
  
  &:hover {
    background-color: ${props => props.isUser 
      ? 'var(--chat-color-user-message-hover)'
      : 'var(--chat-color-assistant-message-hover)'};
    box-shadow: var(--chat-shadow-md);
  }
  
  /* Format markdown-style content */
  & ul, & ol {
    margin: var(--chat-spacing-sm) 0;
    padding-left: var(--chat-spacing-lg);
  }
  
  & li {
    margin-bottom: var(--chat-spacing-xs);
  }
  
  & p {
    margin: var(--chat-spacing-sm) 0;
    line-height: var(--chat-line-height-normal);
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Code formatting */
  & pre {
    background-color: ${props => props.isUser 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'var(--chat-color-surface-secondary)'};
    padding: var(--chat-spacing-sm);
    border-radius: var(--chat-border-radius-sm);
    margin: var(--chat-spacing-sm) 0;
    overflow-x: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: var(--chat-font-size-sm);
  }
  
  & code {
    background-color: ${props => props.isUser 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'var(--chat-color-surface-secondary)'};
    padding: 2px var(--chat-spacing-xs);
    border-radius: var(--chat-border-radius-xs);
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: var(--chat-font-size-sm);
  }
`;

// Enhanced selection context with more visual distinction - now collapsible
const SelectionContext = styled.div`
  margin-top: var(--chat-spacing-md);
  background-color:rgb(254, 255, 252); /* You can change this color to your preference */
  border-left: 4px solid var(--chat-color-primary);
  border-radius: var(--chat-border-radius-md);
  font-size: var(--chat-font-size-sm);
  color: var(--chat-color-text-primary);
  max-width: 100%;
  overflow: hidden;
  box-shadow: var(--chat-shadow-sm);
  border: 1px solid var(--chat-color-primary-light);
  margin-bottom: var(--chat-spacing-sm);
  transition: all 0.2s ease-in-out;
`;

// Customize the selection header styling
const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--chat-spacing-sm);
  background-color: #e8f0fc; /* Header background color */
  border-bottom: 1px solid var(--chat-color-primary-light);
  cursor: pointer;
  
  &:hover {
    background-color: #dae6f9; /* Darker color on hover */
  }
`;

const SelectionHeaderText = styled.div`
  font-weight: var(--chat-font-weight-semibold);
  color: var(--chat-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SelectionToggleIcon = styled.span<{ isExpanded: boolean }>`
  display: inline-flex;
  width: 16px;
  height: 16px;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
  transform: rotate(${props => props.isExpanded ? '0deg' : '-90deg'});
  font-size: 12px;
`;

const SelectionContentWrapper = styled.div<{ isExpanded: boolean }>`
  padding: ${props => props.isExpanded ? 'var(--chat-spacing-md)' : '0'};
  max-height: ${props => props.isExpanded ? '350px' : '0'};
  opacity: ${props => props.isExpanded ? '1' : '0'};
  overflow-y: auto;
  transition: all 0.3s ease-in-out;
`;

// Customize the selection highlight
const SelectionHighlight = styled.div`
  font-weight: var(--chat-font-weight-semibold);
  color: var(--chat-color-text-primary);
  background-color: #e0ebfa; /* Selection highlight background */
  padding: var(--chat-spacing-sm);
  border-radius: var(--chat-border-radius-md);
  margin: var(--chat-spacing-sm) 0;
  position: relative;
  border: 1px solid #c5d8f7; /* Selection highlight border */
  
  &::before {
    content: 'SELECTED TEXT';
    position: absolute;
    top: -8px;
    left: var(--chat-spacing-sm);
    font-size: 10px;
    background-color: var(--chat-color-primary);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
`;

const SelectionLabel = styled.div`
  font-size: var(--chat-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--chat-color-primary);
  margin-bottom: var(--chat-spacing-sm);
  font-weight: var(--chat-font-weight-bold);
  padding-bottom: var(--chat-spacing-xs);
  border-bottom: 1px solid var(--chat-color-border-light);
`;

// Helper function to get initials from role - updated to use "YOU" instead of "U"
const getInitials = (role: string): string => {
  switch (role) {
    case 'user':
      return 'U';
    case 'assistant':
      return 'A';
    case 'system':
      return 'S';
    default:
      return role.substring(0, 1).toUpperCase();
  }
};

// Helper function to format message content with markdown-like styling
const formatMessageContent = (content: string): React.ReactNode => {
  if (!content) return null;
  
  // Basic support for code blocks (```code```)
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return (
    <MessageContent>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim();
          return <pre key={index}>{code}</pre>;
        }
        
        // Replace inline code (single backticks)
        const inlineParts = part.split(/(`[^`]+`)/g);
        
        return (
          <React.Fragment key={index}>
            {inlineParts.map((inlinePart, i) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                const inlineCode = inlinePart.slice(1, -1);
                return <code key={i}>{inlineCode}</code>;
              }
              
              // Replace URLs with links
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const textWithLinks = inlinePart.split(urlRegex);
              
              return (
                <React.Fragment key={i}>
                  {textWithLinks.map((text, j) => {
                    if (text.match(urlRegex)) {
                      return (
                        <a 
                          key={j} 
                          href={text} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: 'var(--chat-color-primary)', 
                            textDecoration: 'underline' 
                          }}
                        >
                          {text}
                        </a>
                      );
                    }
                    return text;
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </MessageContent>
  );
};

export const Message: React.FC<MessageProps> = ({ message, showTimestamp = false, isUser }) => {
  const isUserMessage = isUser !== undefined ? isUser : message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(false);
  
  // Function to handle image click (for expanding later)
  const handleImageClick = (attachment: Attachment) => {
    console.log('Image clicked:', attachment);
    // Here you could implement a lightbox or other image viewing functionality
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };
  
  // Skip system messages that are just for selection notification
  if (message.role === 'system' && message.selection) {
    return null;
  }

  // Format selection context with better visual distinction
  const formatSelectionContext = (selection: Selection) => {
    return (
      <>
        <SelectionLabel>Context & Selection</SelectionLabel>
        
        {selection.contextBefore && (
          <div style={{ 
            marginBottom: '12px', 
            fontSize: '0.95em',
            color: '#4b5563', // Darker gray for better readability
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f7fa', // Light background for context
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '8px',
              fontSize: '10px',
              backgroundColor: 'white',
              padding: '0 4px',
              color: '#64748b', // Medium slate color
              fontWeight: '500',
            }}>
              BEFORE
            </div>
            {selection.contextBefore}
          </div>
        )}
        
        <SelectionHighlight>
          {selection.text}
        </SelectionHighlight>
        
        {selection.contextAfter && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '0.95em',
            color: '#4b5563', // Darker gray for better readability
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f7fa', // Light background for context
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '8px',
              fontSize: '10px',
              backgroundColor: 'white',
              padding: '0 4px',
              color: '#64748b', // Medium slate color
              fontWeight: '500',
            }}>
              AFTER
            </div>
            {selection.contextAfter}
          </div>
        )}
      </>
    );
  };

  // Helper function to get selection preview text
  const getSelectionPreview = (selection: Selection) => {
    if (!selection || !selection.text) return 'Selected text';
    
    const text = selection.text.trim();
    if (text.length <= 50) return text;
    return `${text.substring(0, 47)}...`;
  };

  const toggleSelectionExpanded = () => {
    setIsSelectionExpanded(!isSelectionExpanded);
  };

  return (
    <MessageContainer isUser={isUserMessage} className={`message-container message-divider ${isUserMessage ? 'user-container' : 'assistant-container'}`}>
      <SenderIndicator 
        isUser={isUserMessage} 
        role={message.role}
        className="sender-indicator"
      >
        {getInitials(message.role)}
      </SenderIndicator>
      
      <MessageWrapper>
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
        <MessageBubble 
          isUser={isUserMessage} 
          role={message.role}
          className={`message-bubble ${isUserMessage ? 'user-message' : message.role === 'system' ? 'system-message' : 'assistant-message'}`}
        >
          {formatMessageContent(message.content)}
        </MessageBubble>
        
        {message.selection && isUserMessage && (
          <SelectionContext>
            <SelectionHeader onClick={toggleSelectionExpanded}>
              <SelectionHeaderText>
                <SelectionToggleIcon isExpanded={isSelectionExpanded}>▼</SelectionToggleIcon>
                Selection: {getSelectionPreview(message.selection)}
              </SelectionHeaderText>
              <span>{isSelectionExpanded ? 'Hide' : 'Show'} context</span>
            </SelectionHeader>
            <SelectionContentWrapper isExpanded={isSelectionExpanded}>
              {formatSelectionContext(message.selection)}
            </SelectionContentWrapper>
          </SelectionContext>
        )}
        
        <MessageMeta>
          <MessageRole>
            {isUserMessage ? 'You' : message.role === 'system' ? 'System' : 'Assistant'}
          </MessageRole>
          {showTimestamp && (
            <Timestamp>{formattedTime}</Timestamp>
          )}
        </MessageMeta>
      </MessageWrapper>
    </MessageContainer>
  );
}; 