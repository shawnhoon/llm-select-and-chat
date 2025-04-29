import React, { useState, useRef, useEffect, KeyboardEvent, MouseEvent, useCallback, useMemo } from 'react';
// Version: 1.0.1 - Context Preservation Fix (2024-05-29)
import styled, { createGlobalStyle, css } from 'styled-components';
import { Message as MessageType, Conversation, UserPreferences, LLMProvider, Selection, Attachment } from '../../types';
import { Message } from './Message';
import { ProviderSelector } from './ProviderSelector';
import { chatTheme } from './theme';

// Simple icon components
const ChevronUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClearIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

// Global styles for CSS variables
const ChatGlobalStyles = createGlobalStyle`
  /* Apply to both :root and our component to ensure the variables are available everywhere */
  :root {
    ${chatTheme.variables}
  }
  
  /* Ensure styles are properly applied to chat components with higher specificity */
  .chat-container, .chat-container * {
    box-sizing: border-box;
  }
  
  /* Force message styling to be applied even with external themes */
  .chat-container .message-container {
    display: flex;
    align-items: flex-start;
    position: relative;
    margin-bottom: var(--chat-spacing-md); /* Ensure consistent spacing */
  }
  
  .chat-container .sender-indicator {
    width: var(--chat-sender-indicator-size);
    height: var(--chat-sender-indicator-size);
    min-width: var(--chat-sender-indicator-size);
    border-radius: var(--chat-border-radius-circle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chat-color-text-on-primary);
    font-size: var(--chat-font-size-xs);
    font-weight: var(--chat-font-weight-bold);
    text-transform: uppercase;
    box-shadow: var(--chat-shadow-sm);
  }
  
  .chat-container .message-bubble {
    padding: var(--chat-spacing-sm);
    border-radius: var(--chat-border-radius-lg);
    box-shadow: var(--chat-shadow-sm);
  }
  
  .chat-container .user-message {
    background-color: var(--chat-color-user-message);
    border-bottom-right-radius: var(--chat-border-radius-xs);
    border: 1px solid var(--chat-color-primary-light);
  }
  
  .chat-container .assistant-message {
    background-color: var(--chat-color-assistant-message);
    border-bottom-left-radius: var(--chat-border-radius-xs);
    border-left: 2px solid var(--chat-color-assistant-border);
    border: 1px solid var(--chat-color-border);
  }
  
  .chat-container .system-message {
    background-color: var(--chat-color-system-message);
    border: 1px solid var(--chat-color-border);
  }
  
  .chat-container .message-divider:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: calc(-1 * var(--chat-spacing-sm) / 2);
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--chat-color-divider);
    pointer-events: none;
  }
  
  /* Enhance code blocks and inline code */
  .chat-container .message-bubble pre {
    background-color: rgba(0, 0, 0, 0.04);
    padding: var(--chat-spacing-sm);
    border-radius: var(--chat-border-radius-sm);
    border: 1px solid rgba(0, 0, 0, 0.1);
    overflow-x: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: var(--chat-font-size-sm);
  }
  
  .chat-container .message-bubble code {
    background-color: rgba(0, 0, 0, 0.04);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 90%;
  }
`;

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--chat-color-surface-primary);
  border-radius: var(--chat-border-radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid var(--chat-color-border);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--chat-spacing-md);
  background-color: var(--chat-color-surface-secondary);
  
  /* Add subtle alternating backgrounds for better visual separation */
  & > div.message-container:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.01);
    border-radius: var(--chat-border-radius-sm);
  }
  
  &::-webkit-scrollbar {
    width: var(--chat-scrollbar-width);
    height: var(--chat-scrollbar-width);
  }
  
  &::-webkit-scrollbar-track {
    background-color: var(--chat-color-surface-secondary);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--chat-color-surface-tertiary);
    border-radius: var(--chat-border-radius-pill);
    border: 3px solid var(--chat-color-surface-secondary);
    
    &:hover {
      background-color: var(--chat-color-surface-quaternary);
    }
  }
`;

const InputContainer = styled.div`
  padding: var(--chat-spacing-md);
  background-color: var(--chat-color-surface-primary);
  border-top: 1px solid var(--chat-color-border);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    height: 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.05), transparent);
    pointer-events: none;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  gap: var(--chat-spacing-sm);
  align-items: flex-end;
  background: var(--chat-color-surface-secondary);
  border-radius: var(--chat-border-radius-lg);
  padding: var(--chat-spacing-xs);
  box-shadow: var(--chat-shadow-sm);
  transition: box-shadow 0.2s ease;
  
  &:focus-within {
    box-shadow: var(--chat-shadow-md);
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: var(--chat-spacing-sm) var(--chat-spacing-md);
  background-color: transparent;
  border: none;
  border-radius: var(--chat-border-radius-md);
  font-family: inherit;
  font-size: var(--chat-font-size-md);
  line-height: var(--chat-line-height-normal);
  color: var(--chat-color-text-primary);
  resize: none;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--chat-color-text-tertiary);
  }
`;

const SendButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  background-color:rgb(194, 230, 246); /* Darker gray for better contrast */
  color: white;
  border: none;
  border-radius: 0; /* Square corners to match screenshot */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 60px;
  height: 32px;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #333333; /* Even darker on hover */
  }
  
  &:active:not(:disabled) {
    background-color: #222222;
  }
  
  &:disabled {
    background-color: #cccccc;
    color: #777777;
    cursor: not-allowed;
  }
`;

const AttachButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background-color: var(--chat-color-surface-primary);
  border: 1px solid var(--chat-color-border);
  border-radius: var(--chat-border-radius-md);
  color: var(--chat-color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--chat-shadow-xs);
  
  &:hover {
    background-color: var(--chat-color-surface-tertiary);
    border-color: var(--chat-color-border-hover);
    color: var(--chat-color-text-primary);
    transform: translateY(-1px);
    box-shadow: var(--chat-shadow-sm);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--chat-spacing-md);
  border-bottom: 1px solid var(--chat-color-border-light);
  background-color: var(--chat-color-surface-secondary);
  border-radius: var(--chat-border-radius-md) var(--chat-border-radius-md) 0 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--chat-font-size-lg);
  color: var(--chat-color-text-primary);
  font-weight: var(--chat-font-weight-bold);
  letter-spacing: -0.25px;
`;

const NewChatButton = styled.button`
  background-color: transparent;
  color: var(--chat-color-primary);
  border: 1px solid var(--chat-color-primary);
  border-radius: var(--chat-border-radius-pill);
  padding: var(--chat-spacing-xs) var(--chat-spacing-md);
  cursor: pointer;
  ${chatTheme.mixins.transition(['background-color', 'transform'])}
  font-weight: var(--chat-font-weight-medium);
  
  &:hover {
    background-color: var(--chat-color-primary-light);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SelectionContext = styled.div`
  display: flex;
  margin-top: var(--chat-spacing-md);
  background-color: #f3f7fd; /* Match color from Message component */
  border-radius: var(--chat-border-radius-md);
  overflow: hidden;
  box-shadow: var(--chat-shadow-sm);
  border: 1px solid var(--chat-color-primary-light);
  margin-bottom: var(--chat-spacing-md);
  flex-direction: column;
`;

const SelectionBar = styled.div`
  width: 5px;
  background-color: var(--chat-color-primary);
  flex-shrink: 0;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
`;

const SelectionHeader = styled.div<{ expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: #e8f0fc;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  flex-wrap: wrap;
  gap: var(--chat-spacing-sm);
  
  &:hover {
    background-color: #dae6f9;
  }
  
  ${props => !props.expanded && `
    border-radius: 6px;
  `}
`;

const SelectionToggleIcon = styled.span<{ expanded: boolean }>`
  display: inline-flex;
  width: 16px;
  height: 16px;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
  transform: rotate(${props => props.expanded ? '0deg' : '-90deg'});
  font-size: 12px;
`;

const SelectionHeaderText = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SelectionContentWrapper = styled.div<{ expanded: boolean }>`
  padding: ${props => props.expanded ? 'var(--chat-spacing-md)' : '0'};
  padding-left: calc(5px + var(--chat-spacing-md)); /* Space for selection bar */
  max-height: ${props => props.expanded ? '400px' : '0'};
  opacity: ${props => props.expanded ? '1' : '0'};
  overflow-y: auto;
  transition: all 0.3s ease-in-out;
  position: relative;
`;

const SelectionContent = styled.div`
  flex: 1;
  padding: var(--chat-spacing-md);
  font-size: var(--chat-font-size-md);
  color: var(--chat-color-text-primary);
  max-height: 200px;
  overflow-y: auto;
  ${chatTheme.mixins.transition(['max-height'])}
  
  &:hover {
    max-height: 400px; /* Increase max height on hover */
  }
`;

const SelectionHighlight = styled.span`
  font-weight: var(--chat-font-weight-semibold);
  color: var(--chat-color-primary);
  background-color: var(--chat-color-primary-light);
  padding: 3px 8px;
  border-radius: var(--chat-border-radius-xs);
  display: inline-block;
  margin: 3px 0;
`;

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--chat-spacing-sm);
  font-size: var(--chat-font-size-sm);
  color: var(--chat-color-text-secondary);
  font-weight: var(--chat-font-weight-medium);
`;

const SelectionActionButton = styled.button`
  background-color: var(--chat-color-primary);
  color: var(--chat-color-surface-primary);
  border: none;
  border-radius: var(--chat-border-radius-pill);
  padding: 4px 8px; /* Reduced padding */
  cursor: pointer;
  font-size: 11px; /* Smaller font size */
  ${chatTheme.mixins.transition(['background-color', 'transform'])}
  height: 22px; /* Explicit height */
  min-width: 0; /* Allow button to shrink */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--chat-font-weight-medium);
  
  &:hover {
    background-color: var(--chat-color-primary-dark);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Add this component for when no selection is available
const NoSelectionMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--chat-spacing-lg);
  text-align: center;
  color: var(--chat-color-text-secondary);
  font-size: var(--chat-font-size-md);
  gap: var(--chat-spacing-md);
`;

const KeyboardShortcutHint = styled.div`
  display: flex;
  align-items: center;
  gap: var(--chat-spacing-xs);
  font-size: var(--chat-font-size-sm);
  color: var(--chat-color-text-tertiary);
`;

const ShortcutKey = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--chat-spacing-xs);
  background-color: var(--chat-color-surface-tertiary);
  border-radius: var(--chat-border-radius-xs);
  font-size: var(--chat-font-size-sm);
  font-weight: var(--chat-font-weight-medium);
  color: var(--chat-color-text-secondary);
  ${chatTheme.mixins.transition(['background-color'])}
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--chat-spacing-sm);
  margin-bottom: var(--chat-spacing-sm);
  padding: var(--chat-spacing-sm);
  background: var(--chat-color-surface-secondary);
  border-radius: var(--chat-border-radius-md);
  border: 1px solid var(--chat-color-border-light);
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--chat-border-radius-sm);
  overflow: hidden;
  box-shadow: var(--chat-shadow-sm);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--chat-shadow-md);
  }
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
  border-radius: var(--chat-border-radius-circle);
  background-color: var(--chat-color-surface-primary);
  border: 1px solid var(--chat-color-border);
  color: var(--chat-color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--chat-font-size-sm);
  line-height: 1;
  padding: 0;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--chat-color-status-error);
    border-color: var(--chat-color-status-error);
    color: var(--chat-color-text-on-primary);
    transform: scale(1.1);
  }
`;

const SelectionTitle = styled.h4`
  margin: 0;
  font-size: var(--chat-font-size-md);
  font-weight: var(--chat-font-weight-bold);
  color: var(--chat-color-primary);
`;

const ClearSelectionButton = styled.button`
  background: none;
  border: 1px solid var(--chat-color-border);
  color: var(--chat-color-text-secondary);
  cursor: pointer;
  padding: var(--chat-spacing-xs) var(--chat-spacing-sm);
  border-radius: var(--chat-border-radius-sm);
  line-height: 1;
  font-weight: var(--chat-font-weight-medium);
  ${chatTheme.mixins.transition(['color', 'background-color', 'border-color'])}
  
  &:hover {
    color: var(--chat-color-text-primary);
    background-color: var(--chat-color-surface-tertiary);
    border-color: var(--chat-color-border-hover);
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
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(false);
  
  // Log that we're rendering the component to help with debugging
  console.log('%c🔎 ChatInterface rendering with styling debug active', 'background: #ff0000; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
  console.log('Send button should be RED with ORANGE border');
  
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
    const selectionText = selection.text ?? '';
    
    // Enhanced logging to help debug context issues
    console.log('%c📋 Rendering selection context (v1.0.1):', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;', {
      selectionTextLength: selectionText.length,
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
        {/* Context Before */}
        <div style={{ 
          marginBottom: '12px', 
          fontSize: '0.95em', 
          color: '#4b5563', // Darker gray for better readability
          whiteSpace: 'pre-wrap',
          maxHeight: '150px',
          overflowY: 'auto',
          backgroundColor: '#f5f7fa', // Light background for context
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}>
          {/*beforeContext || 'No context before selection'}*/}
        </div>
        
        {/* Selection Text */}
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: '#e0ebfa', // Selection highlight background
          border: '1px solid #c5d8f7', // Selection highlight border
          fontWeight: 600,
          marginBottom: '12px',
          position: 'relative',
        }}>
          {selectionText || ''}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '12px',
            fontSize: '11px',
            backgroundColor: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #c5d8f7',
            color: 'var(--chat-color-primary)',
          }}>
            SELECTED TEXT
          </div>
        </div>
        
        {/* Context After */}
        <div style={{ 
          marginTop: '12px', 
          fontSize: '0.95em', 
          color: '#4b5563', // Darker gray for better readability
          whiteSpace: 'pre-wrap',
          maxHeight: '150px',
          overflowY: 'auto',
          backgroundColor: '#f5f7fa', // Light background for context
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}>
          {/*afterContext || 'No context after selection'}*/}
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
  
  // Add a helper function to get a preview of the selected text
  const getSelectionPreview = (selection: Selection | null) => {
    if (!selection || !selection.text) return 'Selected text';
    
    const text = selection.text.trim();
    if (text.length <= 60) return text;
    return `${text.substring(0, 57)}...`;
  };
  
  return (
    <>
      <ChatGlobalStyles />
      <ChatContainer className="chat-container">
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
              <SelectionHeader 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectionExpanded(!isSelectionExpanded);
                }}
                expanded={isSelectionExpanded}
              >
                <SelectionHeaderText>
                  <SelectionToggleIcon expanded={isSelectionExpanded}>▼</SelectionToggleIcon>
                  Selection Context
                  <span style={{ fontSize: '12px', color: 'var(--chat-color-text-tertiary)' }}>
                    ({getWordCount(currentSelection.text)} words)
                  </span>
                </SelectionHeaderText>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SelectionActionButton onClick={(e) => {
                    e.stopPropagation();
                    handleAskAboutSelection();
                  }}>
                    Ask
                  </SelectionActionButton>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionExpanded(!isSelectionExpanded);
                    }}
                    style={{ 
                      marginLeft: 'auto',
                      fontSize: '11px', 
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isSelectionExpanded ? 
                      <>Hide <ChevronUpIcon size={12} /></> : 
                      <>Show <ChevronDownIcon size={12} /></>} context
                  </span>
                  <ClearSelectionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                  >
                    <ClearIcon /></ClearSelectionButton>
                </div>
              </SelectionHeader>
              <SelectionContentWrapper expanded={isSelectionExpanded}>
                {formatSelectionContext(currentSelection)}
              </SelectionContentWrapper>
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
          <InputWrapper>
            <TextArea
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
          </InputWrapper>
        </InputContainer>
      </ChatContainer>
    </>
  );
}; 