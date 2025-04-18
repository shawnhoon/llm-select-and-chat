import React from 'react';
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

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  max-width: 85%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isUser ? props.theme.colors.primary + '5' : props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.isUser ? props.theme.colors.primary + '30' : props.theme.colors.border};
`;

const MessageContent = styled.div`
  font-size: ${props => props.theme.fontSizes.medium};
  color: ${props => props.theme.colors.text};
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.sm};
`;

const Timestamp = styled.span`
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
`;

const MessageRole = styled.span`
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
`;

const AttachmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ImageAttachment = styled.div`
  width: 200px;
  border-radius: ${props => props.theme.borderRadius.small};
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
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
  background-color: ${props => props.isUser 
    ? props.theme.colors.primary
    : props.theme.colors.surface};
  color: ${props => props.isUser 
    ? props.theme.colors.textOnPrimary
    : props.theme.colors.text};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 18px;
  max-width: 80%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.5;
  font-size: ${props => props.theme.fontSizes.medium};
  letter-spacing: 0.01em;
  
  ${props => props.isUser 
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
    background-color: ${props => props.isUser 
      ? 'rgba(0, 0, 0, 0.2)' 
      : props.theme.colors.backgroundLight};
    padding: 0.75em;
    border-radius: 6px;
    margin: 0.5em 0;
    overflow-x: auto;
    color: ${props => props.isUser 
      ? props.theme.colors.textOnPrimary 
      : props.theme.colors.text};
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  & code {
    background-color: ${props => props.isUser 
      ? 'rgba(0, 0, 0, 0.2)' 
      : props.theme.colors.backgroundLight};
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
`;

const SelectionContext = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-left: 4px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  max-width: 90%;
  max-height: 200px;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: ${props => props.theme.spacing.sm};
  align-self: flex-start;
`;

const SelectionHighlight = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  background-color: ${props => props.theme.colors.primaryLight}40; // 25% opacity
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin: 3px 0;
`;

const SelectionLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.xsmall};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
  font-weight: 600;
`;

// Helper function to format message content with proper rendering of code blocks and markdown
const formatMessageContent = (content: string): React.ReactNode => {
  // Split by code blocks first
  const segments = content.split(/(```[\s\S]*?```)/g);
  
  return segments.map((segment, index) => {
    // Handle code blocks
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const codeContent = segment.slice(3, -3);
      // Check if there's a language specifier
      const firstLineBreak = codeContent.indexOf('\n');
      let language = '';
      let code = codeContent;
      
      if (firstLineBreak > 0) {
        language = codeContent.slice(0, firstLineBreak).trim();
        // Check if the first line is actually a language indicator
        if (/^[a-zA-Z0-9_]+$/.test(language)) {
          code = codeContent.slice(firstLineBreak + 1);
        } else {
          language = '';
        }
      }
      
      return (
        <pre key={index}>
          {language && <div style={{ marginBottom: '0.5em', opacity: 0.7 }}>{language}</div>}
          <code>{code}</code>
        </pre>
      );
    }
    
    // Handle inline code
    const inlineCodeSegments = segment.split(/(`[^`]+`)/g);
    
    if (inlineCodeSegments.length > 1) {
      return (
        <React.Fragment key={index}>
          {inlineCodeSegments.map((codeSeg, codeIdx) => {
            if (codeSeg.startsWith('`') && codeSeg.endsWith('`')) {
              return <code key={codeIdx}>{codeSeg.slice(1, -1)}</code>;
            }
            
            // Handle bullet points and other formatting in text segments
            const lines = codeSeg.split('\n');
            return (
              <React.Fragment key={codeIdx}>
                {lines.map((line, lineIdx) => {
                  // Check for bullet points
                  if (line.match(/^[\s]*[-*+][\s]+/)) {
                    return (
                      <React.Fragment key={lineIdx}>
                        {lineIdx > 0 && <br />}
                        <span style={{ display: 'flex' }}>
                          <span style={{ marginRight: '0.5em' }}>•</span>
                          <span>{line.replace(/^[\s]*[-*+][\s]+/, '')}</span>
                        </span>
                      </React.Fragment>
                    );
                  }
                  
                  // Check for numbered lists
                  if (line.match(/^[\s]*\d+\.[\s]+/)) {
                    const number = line.match(/^[\s]*(\d+)\./)?.[1] || '';
                    return (
                      <React.Fragment key={lineIdx}>
                        {lineIdx > 0 && <br />}
                        <span style={{ display: 'flex' }}>
                          <span style={{ marginRight: '0.5em', minWidth: '1.5em' }}>{number}.</span>
                          <span>{line.replace(/^[\s]*\d+\.[\s]+/, '')}</span>
                        </span>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <React.Fragment key={lineIdx}>
                      {lineIdx > 0 && <br />}
                      {line}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      );
    }
    
    // Render normal text with line breaks
    const lines = segment.split('\n');
    return (
      <React.Fragment key={index}>
        {lines.map((line, lineIdx) => {
          // Check for bullet points
          if (line.match(/^[\s]*[-*+][\s]+/)) {
            return (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                <span style={{ display: 'flex' }}>
                  <span style={{ marginRight: '0.5em' }}>•</span>
                  <span>{line.replace(/^[\s]*[-*+][\s]+/, '')}</span>
                </span>
              </React.Fragment>
            );
          }
          
          // Check for numbered lists
          if (line.match(/^[\s]*\d+\.[\s]+/)) {
            const number = line.match(/^[\s]*(\d+)\./)?.[1] || '';
            return (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                <span style={{ display: 'flex' }}>
                  <span style={{ marginRight: '0.5em', minWidth: '1.5em' }}>{number}.</span>
                  <span>{line.replace(/^[\s]*\d+\.[\s]+/, '')}</span>
                </span>
              </React.Fragment>
            );
          }
          
          return (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {line}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });
};

export const Message: React.FC<MessageProps> = ({ message, showTimestamp = false }) => {
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
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

  // Format selection context
  const formatSelectionContext = (selection: Selection) => {
    return (
      <>
        <SelectionLabel>Selected Text:</SelectionLabel>
        {selection.contextBefore && (
          <div style={{ 
            marginBottom: '8px', 
            fontSize: '0.95em', 
            opacity: 0.85,
          }}>
            {selection.contextBefore}
          </div>
        )}
        <SelectionHighlight>{selection.text}</SelectionHighlight>
        {selection.contextAfter && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.95em', 
            opacity: 0.85,
          }}>
            {selection.contextAfter}
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
        {formatMessageContent(message.content)}
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