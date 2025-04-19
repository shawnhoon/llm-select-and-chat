import React, { useState, useRef, useEffect } from 'react';
// Version: 1.0.1 - Context Preservation Fix (2024-05-29)
import styled from 'styled-components';
import { Message as MessageType, Conversation, UserPreferences, LLMProvider, Selection, Attachment } from '../../types';
import { Message } from './Message';
import { ProviderSelector } from './ProviderSelector';

// Types
interface ChatInterfaceProps {
  conversation: Conversation;
  userPreferences?: UserPreferences;
  llmProvider?: LLMProvider;
  selection?: Selection | null;
  onSendMessage: (message: string, attachments?: Attachment[]) => Promise<void>;
  onNewConversation: () => void;
  onError?: (error: Error) => void;
  onProviderChange?: (provider: LLMProvider) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: ${props => props.theme.borderRadius.medium};
  background-color: ${props => props.theme.colors.background};
  box-shadow: ${props => props.theme.boxShadow.medium};
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  gap: ${props => props.theme.spacing.md};
  scroll-behavior: smooth;
`;

const InputContainer = styled.div`
  display: flex;
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: 0 0 ${props => props.theme.borderRadius.medium} ${props => props.theme.borderRadius.medium};
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 25px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: inherit;
  font-size: ${props => props.theme.fontSizes.medium};
  resize: none;
  min-height: 48px;
  max-height: 200px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, height 0.2s ease;
  overflow-y: auto;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primaryLight};
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textOnPrimary};
  border: none;
  border-radius: 25px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.backgroundDisabled};
    cursor: not-allowed;
    transform: none;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.medium} ${props => props.theme.borderRadius.medium} 0 0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const NewChatButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 20px;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryLight};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SelectionContext = styled.div`
  display: flex;
  margin-top: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.medium};
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SelectionBar = styled.div`
  width: 5px;
  background-color: ${props => props.theme.colors.primary};
  flex-shrink: 0;
`;

const SelectionContent = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.medium};
  color: ${props => props.theme.colors.text};
  max-height: 120px;
  overflow-y: auto;
  transition: max-height 0.3s ease;
  
  &:hover {
    max-height: 300px;
  }
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

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const SelectionActionButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textOnPrimary};
  border: none;
  border-radius: 18px;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 500;
  display: inline-block;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Add this component for when no selection is available
const NoSelectionMessage = styled.div`
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 0;
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  font-style: italic;
`;

const KeyboardShortcutHint = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ShortcutKey = styled.span`
  display: inline-block;
  padding: 1px 6px;
  margin: 0 2px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 3px;
  font-family: monospace;
  font-weight: 600;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px dashed ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: ${props => props.theme.borderRadius.small};
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const SelectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SelectionTitle = styled.h4`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.medium};
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const ClearSelectionButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.primary};
  border: none;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    text-decoration: underline;
  }
`;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  userPreferences,
  llmProvider,
  selection,
  onSendMessage,
  onNewConversation,
  onError,
  onProviderChange,
  inputRef
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const [apiKeys, setApiKeys] = useState<{
    openai?: string;
    gemini?: string;
    claude?: string;
  }>({
    openai: llmProvider?.type === 'openai' ? llmProvider.apiKey : '',
    gemini: llmProvider?.type === 'gemini' ? llmProvider.apiKey : '',
    claude: llmProvider?.type === 'claude' ? llmProvider.apiKey : '',
  });
  
  // Adjust input height based on content
  const adjustInputHeight = () => {
    const textarea = inputRef?.current;
    if (!textarea) return;
    
    // Reset height to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set to scrollHeight but cap at max-height via CSS
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };
  
  // Update height when input value changes
  useEffect(() => {
    adjustInputHeight();
  }, [inputValue]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);
  
  // Add a new effect to handle selection changes
  useEffect(() => {
    console.log('%c🔄 Selection in ChatInterface updated (v1.0.1):', 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;', selection);
    
    if (selection) {
      // Log all selection properties
      console.log('Selection properties:');
      Object.entries(selection).forEach(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`- ${key}: ${value.length} chars${value.length > 0 ? ` (sample: "${value.substring(0, Math.min(30, value.length))}${value.length > 30 ? '...' : ''}")` : ''}`);
        } else {
          console.log(`- ${key}: ${value}`);
        }
      });
      
      // Create a deep copy to ensure all properties are preserved
      const selectionCopy = {
        text: selection.text || '',
        contextBefore: selection.contextBefore || '',
        contextAfter: selection.contextAfter || '',
        url: selection.url || '',
        location: selection.location || '',
        fullDocument: selection.fullDocument || ''
      };
      
      console.log('Selection copy created with:', {
        textLength: selectionCopy.text.length,
        contextBeforeLength: selectionCopy.contextBefore.length,
        contextAfterLength: selectionCopy.contextAfter.length,
        keys: Object.keys(selectionCopy).join(', ')
      });
      
      // Log context samples if they exist
      if (selectionCopy.contextBefore && selectionCopy.contextBefore.length > 0) {
        console.log('Context before sample:', selectionCopy.contextBefore.substring(0, Math.min(50, selectionCopy.contextBefore.length)) + '...');
      }
      
      if (selectionCopy.contextAfter && selectionCopy.contextAfter.length > 0) {
        console.log('Context after sample:', selectionCopy.contextAfter.substring(0, Math.min(50, selectionCopy.contextAfter.length)) + '...');
      }
      
      setCurrentSelection(selectionCopy);
    } else if (selection === null) {
      setCurrentSelection(null);
    }
  }, [selection]);
  
  // Update API key effect when llmProvider changes
  useEffect(() => {
    if (llmProvider) {
      setApiKeys(prev => ({
        ...prev,
        [llmProvider.type]: llmProvider.apiKey || prev[llmProvider.type as keyof typeof prev] || ''
      }));
    }
  }, [llmProvider]);
  
  // Handle message submission
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;
    
    try {
      setIsLoading(true);
      await onSendMessage(inputValue, attachments.length > 0 ? attachments : undefined);
      setInputValue('');
      setAttachments([]);
      // Reset input height after sending
      if (inputRef?.current) {
        inputRef.current.style.height = '48px';
      }
    } catch (error) {
      if (error instanceof Error && onError) {
        onError(error);
      } else {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keyboard events (Enter to send, Shift+Enter for new line, Escape to clear selection)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      } else {
        // Shift+Enter - will naturally add a newline, then we adjust height
        setTimeout(adjustInputHeight, 0);
      }
    } else if (e.key === 'Escape' && currentSelection) {
      // Clear the selection when Escape is pressed if there's a current selection
      e.preventDefault();
      setCurrentSelection(null);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle paste event for images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasHandledImage = false;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle image files from clipboard
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (!blob) continue;
        
        // Generate a unique ID
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a preview URL
        const imageUrl = URL.createObjectURL(blob);
        
        // Add to attachments
        const newAttachment: Attachment = {
          id,
          type: 'image',
          name: `Pasted Image ${new Date().toLocaleTimeString()}`,
          data: blob,
          url: imageUrl,
          mimeType: blob.type
        };
        
        setAttachments(prev => [...prev, newAttachment]);
        hasHandledImage = true;
      }
    }
    
    // Only prevent default if we handled an image
    if (hasHandledImage) {
      e.preventDefault();
      
      // Show a brief visual feedback that image was added
      if (inputRef?.current) {
        const originalBorder = inputRef.current.style.border;
        inputRef.current.style.border = '2px solid #4ade80'; // success color
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.style.border = originalBorder;
          }
        }, 500);
      }
    }
  };
  
  // Handle removing an image
  const handleRemoveImage = (id: string) => {
    setAttachments(prev => {
      const newAttachments = prev.filter(attachment => attachment.id !== id);
      
      // Revoke the URL to free memory
      const removedAttachment = prev.find(attachment => attachment.id === id);
      if (removedAttachment?.url) {
        URL.revokeObjectURL(removedAttachment.url);
      }
      
      return newAttachments;
    });
  };
  
  const formatSelectionContext = (selection: Selection | null) => {
    if (!selection) return null;
    
    // Use optional chaining and nullish coalescing to safely access properties
    const beforeContext = selection.contextBefore ?? '';
    const afterContext = selection.contextAfter ?? '';
    
    // Enhanced logging to help debug context issues
    console.log('%c📋 Rendering selection context (v1.0.1):', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;', {
      selectionTextLength: selection.text?.length || 0,
      beforeContextLength: beforeContext.length,
      afterContextLength: afterContext.length,
      hasBeforeContext: beforeContext.length > 0,
      hasAfterContext: afterContext.length > 0,
      beforeContextSample: beforeContext ? beforeContext.substring(0, Math.min(50, beforeContext.length)) + (beforeContext.length > 50 ? '...' : '') : '',
      afterContextSample: afterContext ? afterContext.substring(0, Math.min(50, afterContext.length)) + (afterContext.length > 50 ? '...' : '') : '',
      selectionKeys: Object.keys(selection).join(', ')
    });
    
    return (
      <>
        <div style={{ 
          marginBottom: '8px', 
          fontSize: '0.95em', 
          opacity: 0.85,
          color: '#64748b', // Slate-500 for context, regardless of theme
          whiteSpace: 'pre-wrap', // Preserve line breaks
          maxHeight: '150px',
          overflowY: 'auto',
          border: beforeContext ? 'none' : '1px dashed #cbd5e1',
          padding: beforeContext ? '0' : '4px',
          borderRadius: '4px',
          minHeight: beforeContext ? '0' : '20px'
        }}>
          {beforeContext || 'No context before selection'}
        </div>
        <SelectionHighlight>{selection.text || ''}</SelectionHighlight>
        <div style={{ 
          marginTop: '8px', 
          fontSize: '0.95em', 
          opacity: 0.85,
          color: '#64748b', // Slate-500 for context, regardless of theme
          whiteSpace: 'pre-wrap', // Preserve line breaks
          maxHeight: '150px',
          overflowY: 'auto',
          border: afterContext ? 'none' : '1px dashed #cbd5e1',
          padding: afterContext ? '0' : '4px',
          borderRadius: '4px',
          minHeight: afterContext ? '0' : '20px'
        }}>
          {afterContext || 'No context after selection'}
        </div>
      </>
    );
  };
  
  // Add a helper method to handle asking about the selection
  const handleAskAboutSelection = () => {
    if (currentSelection) {
      // Create a more informative query with context references
      const contextQuery = currentSelection.text.length > 80 
        ? `Tell me about this selected text: "${currentSelection.text.substring(0, 80)}..."`
        : `Tell me about this selected text: "${currentSelection.text}"`;
      
      setInputValue(contextQuery);
      
      // Focus the input field
      inputRef?.current?.focus();
    }
  };
  
  // Count words in selection
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };
  
  const handleProviderChange = (newProvider: LLMProvider) => {
    if (onProviderChange) {
      onProviderChange(newProvider);
    }
  };
  
  const handleApiKeysChange = (newKeys: { openai?: string; gemini?: string; claude?: string }) => {
    setApiKeys(newKeys);
  };
  
  // Add a helper method to handle clearing the selection
  const handleClearSelection = () => {
    if (currentSelection) {
      setCurrentSelection(null);
    }
  };
  
  return (
    <ChatContainer>
      <Header>
        <HeaderRow>
          <Title>Chat</Title>
          <NewChatButton onClick={onNewConversation}>
            New Chat
          </NewChatButton>
        </HeaderRow>
        
        {onProviderChange && (
          <ProviderSelector
            currentProvider={llmProvider}
            onProviderChange={handleProviderChange}
            apiKeys={apiKeys}
            onApiKeysChange={handleApiKeysChange}
          />
        )}
        
        {currentSelection && (
          <SelectionContext>
            <SelectionBar />
            <SelectionContent>
              <SelectionHeader>
                <SelectionTitle>Selected Text</SelectionTitle>
                <ClearSelectionButton onClick={handleClearSelection} title="Clear selection (Esc)">
                  ✕
                </ClearSelectionButton>
              </SelectionHeader>
              {formatSelectionContext(currentSelection)}
              <SelectionInfo>
                <span>{getWordCount(currentSelection.text)} words selected</span>
                <SelectionActionButton onClick={handleAskAboutSelection}>
                  Ask about this selection
                </SelectionActionButton>
              </SelectionInfo>
            </SelectionContent>
          </SelectionContext>
        )}
      </Header>
      
      {conversation.messages.length === 0 && !currentSelection && (
        <NoSelectionMessage>
          Select some text on the page to start chatting about it
          <KeyboardShortcutHint>
            Pro tip: Use <ShortcutKey>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</ShortcutKey>+<ShortcutKey>Shift</ShortcutKey>+<ShortcutKey>C</ShortcutKey> after selecting text
          </KeyboardShortcutHint>
        </NoSelectionMessage>
      )}
      
      <MessagesContainer>
        {conversation.messages.map((message) => (
          <Message 
            key={message.id} 
            message={message} 
            showTimestamp={true}
          />
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        {attachments.length > 0 && (
          <ImagePreviewContainer>
            {attachments.map(attachment => (
              <ImagePreview key={attachment.id}>
                <PreviewImage src={attachment.url} alt={attachment.name} />
                <RemoveImageButton onClick={() => handleRemoveImage(attachment.id)}>×</RemoveImageButton>
              </ImagePreview>
            ))}
          </ImagePreviewContainer>
        )}
        <MessageInput
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={attachments.length > 0 ? "Add a caption to your image(s) or press Send..." : "Type your message or paste an image..."}
          rows={1}
          disabled={isLoading}
        />
        <SendButton onClick={handleSendMessage} disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}>
          {isLoading ? 'Sending...' : 'Send'}
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}; 