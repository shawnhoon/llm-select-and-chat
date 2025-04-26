import React, { useState, useRef, useEffect, CSSProperties, useContext } from 'react';
// Version: 1.0.1 - Context Preservation Fix (2024-05-29)
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType, Conversation, UserPreferences, LLMProvider, Selection, Attachment } from '../../types';
import { Message } from './Message';
import { ProviderSelector } from './ProviderSelector';
import { SelectionCaptureProvider, SelectionCaptureContext } from '../SelectionCapture';
import { ImageSelectionPanel } from './ImageSelectionPanel';
import { MessageInput } from './MessageInput';

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

// Styled components for markdown rendering
const MarkdownImage = styled.img`
  max-width: 100%;
  border-radius: ${props => props.theme.borderRadius.small};
  margin: 8px 0;
  border: 1px solid ${props => props.theme.colors.border};
`;

const MarkdownPre = styled.pre`
  background-color: ${props => props.theme.colors.backgroundLight};
  padding: 0.75em;
  border-radius: 6px;
  margin: 0.5em 0;
  overflow-x: auto;
  color: ${props => props.theme.colors.text};
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
`;

const MarkdownCode = styled.code`
  background-color: ${props => props.theme.colors.backgroundLight};
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
`;

// Add new styled components for image selection
const ImagePickerButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.primary};
  border: none;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryLight}30;
  }
`;

const ImageIcon = styled.span`
  font-size: 16px;
`;

const SelectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Add a wrapper component to access the selection capture context
const SelectionWrapper: React.FC<ChatInterfaceProps> = (props) => {
  const { 
    selection: selectionProp, 
    conversation, 
    onSendMessage, 
    onNewConversation, 
    onError,
    onProviderChange,
    userPreferences,
    llmProvider,
    inputRef
  } = props;
  
  // Create a local copy of the selection to synchronize with context
  const [localSelection, setLocalSelection] = useState<Selection | null>(selectionProp || null);
  
  // Update local selection when the prop changes
  useEffect(() => {
    setLocalSelection(selectionProp || null);
  }, [selectionProp]);
  
  return (
    <SelectionCaptureProvider autoCapture={false}>
      <SelectionContextBridge 
        selection={localSelection}
        setSelection={setLocalSelection}
        {...props}
      />
    </SelectionCaptureProvider>
  );
};

// Bridge component to connect selection context with local state
const SelectionContextBridge: React.FC<ChatInterfaceProps & { setSelection: (selection: Selection | null) => void }> = (props) => {
  const selectionContext = useContext(SelectionCaptureContext);
  
  // Make sure context exists before using it
  if (!selectionContext) {
    console.error('SelectionCaptureContext is undefined. Make sure this component is used within a SelectionCaptureProvider.');
    return <ChatInterfaceInner {...props} />;
  }
  
  const { selectedImages } = selectionContext;
  const { selection, setSelection, ...chatProps } = props;
  
  // Log what we're getting from context
  console.log('🔍 SelectionContextBridge - Context images:', selectedImages);
  console.log('🔍 SelectionContextBridge - Current selection:', selection);
  
  // CRITICAL FIX: Do not replace existing attachments with empty array
  let enhancedSelection = selection;
  
  if (selection) {
    const existingAttachments = selection.attachments || [];
    console.log('👁️ Existing attachments:', existingAttachments.length);
    
    // Only replace attachments if we have images in context or no existing attachments
    if (selectedImages.length > 0 || existingAttachments.length === 0) {
      enhancedSelection = {
        ...selection,
        attachments: selectedImages.length > 0 ? selectedImages : existingAttachments
      };
    }
  }
  
  // Log what we're sending to the inner component
  if (enhancedSelection) {
    const attachments = enhancedSelection.attachments || [];
    console.log('✅ Final selection with images:', attachments.length, 'images');
    if (attachments.length > 0) {
      console.log('📸 Image URLs:', attachments.map(a => a.url));
    }
  }
  
  // Pass the selection with proper attachments to inner component
  return <ChatInterfaceInner {...chatProps} selection={enhancedSelection} />;
};

// The inner ChatInterface component (rename the original component)
const ChatInterfaceInner: React.FC<ChatInterfaceProps> = ({
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
  const [showSelectionsInChat, setShowSelectionsInChat] = useState<boolean>(true);
  const [apiKeys, setApiKeys] = useState<{
    openai?: string;
    gemini?: string;
    claude?: string;
  }>({
    openai: llmProvider?.type === 'openai' ? llmProvider.apiKey : '',
    gemini: llmProvider?.type === 'gemini' ? llmProvider.apiKey : '',
    claude: llmProvider?.type === 'claude' ? llmProvider.apiKey : '',
  });
  
  // Add state for image selection panel
  const [showImagePanel, setShowImagePanel] = useState(false);
  
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
    if (selection) {
      // Create a complete copy with all properties
      const selectionCopy = {
        text: selection.text || '',
        contextBefore: selection.contextBefore || '',
        contextAfter: selection.contextAfter || '',
        url: selection.url || '',
        location: selection.location || '',
        fullDocument: selection.fullDocument || ''
      } as Selection;
      
      // Explicitly add attachments if present
      if (selection.attachments && selection.attachments.length > 0) {
        selectionCopy.attachments = [...selection.attachments];
      }
      
      // Apply the selection to state
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
  
  // Custom markdown components
  const markdownComponents = {
    img: ({ node, ...props }: any) => (
      <MarkdownImage {...props} alt={props.alt || 'Image'} />
    ),
    pre: ({ node, children, ...props }: any) => (
      <MarkdownPre {...props}>{children}</MarkdownPre>
    ),
    code: ({ node, inline, children, ...props }: any) => {
      return inline ? 
        <MarkdownCode {...props}>{children}</MarkdownCode> : 
        <span {...props}>{children}</span>;
    }
  };
  
  // Format selection context for display
  const formatSelectionContext = (selection: Selection | null) => {
    if (!selection) return null;
    
    // IMPORTANT: Direct inspection of data when rendering
    console.log('🎨 Rendering selection in formatSelectionContext:', selection);
    console.log('🎨 Has attachments property?', selection.hasOwnProperty('attachments'));
    console.log('🎨 Raw attachments value:', selection.attachments);
    
    // Safely handle attachments with proper type safety
    const attachments = selection.attachments || [];
    const hasAttachments = attachments.length > 0;
    
    // Debug each attachment in detail
    if (hasAttachments) {
      console.log(`🖼️ Found ${attachments.length} attachments to render:`);
      attachments.forEach((attachment, i) => {
        console.log(`  ${i+1}. ${attachment.name || 'Unnamed'}: ${attachment.url ? '✓ Has URL' : '❌ No URL'}`);
      });
    }
    
    return (
      <div>
        {/* Selected Text and Context */}
        <div style={{ fontWeight: 500, marginBottom: '10px' }}>
          {hasAttachments ? 'Selected Content:' : 'Selected Text:'}
        </div>
        
        {selection.contextBefore && (
          <div style={{
            color: '#666',
            paddingBottom: '5px',
            borderBottom: '1px solid #eee',
            fontSize: '0.85em',
            marginBottom: '5px',
          }}>
            {selection.contextBefore}
          </div>
        )}
        
        <div style={{
          fontWeight: 600,
          color: '#2563eb',
          padding: '5px',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          marginBottom: '5px',
        }}>
          {selection.text}
        </div>
        
        {selection.contextAfter && (
          <div style={{
            color: '#666',
            paddingTop: '5px',
            borderTop: '1px solid #eee',
            fontSize: '0.85em',
          }}>
            {selection.contextAfter}
          </div>
        )}
        
        {/* Image thumbnails - CRITICAL RENDERING WITH EXTRA SAFETY CHECKS */}
        {hasAttachments && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '0.9em', marginBottom: '8px', fontWeight: 500, color: '#2563eb' }}>
              Selected Images ({attachments.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {attachments.map((attachment, index) => {
                // Extra safety check
                console.log(`Rendering attachment ${index}:`, attachment);
                
                if (attachment && attachment.type === 'image' && attachment.url) {
                  return (
                    <div 
                      key={attachment.id || `img-${index}`} 
                      style={{ 
                        width: '120px', 
                        height: '120px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '2px solid #3b82f6',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img 
                        src={attachment.url} 
                        alt={attachment.name || `Image ${index + 1}`} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
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
        
        <div style={{ fontSize: '0.7em', color: '#666', marginTop: '10px', textAlign: 'right' }}>
          {selection.text.split(/\s+/).length} words selected
          {hasAttachments && ` • ${attachments.length} images`}
        </div>
      </div>
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
  
  // Handle provider change
  const handleProviderChange = (newProvider: LLMProvider) => {
    if (onProviderChange) {
      onProviderChange(newProvider);
    }
  };
  
  // Handle API keys change
  const handleApiKeysChange = (newKeys: { openai?: string; gemini?: string; claude?: string }) => {
    setApiKeys(newKeys);
  };
  
  // Add a helper method to handle clearing the selection
  const handleClearSelection = () => {
    if (currentSelection) {
      setCurrentSelection(null);
    }
  };
  
  // Toggle image selection panel
  const toggleImagePanel = () => {
    setShowImagePanel(prev => !prev);
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
                <SelectionActions>
                  <ImagePickerButton onClick={toggleImagePanel}>
                    <ImageIcon>🖼️</ImageIcon> Images
                  </ImagePickerButton>
                  <SelectionActionButton onClick={handleAskAboutSelection}>
                    Ask about this selection
                  </SelectionActionButton>
                </SelectionActions>
              </SelectionInfo>
              
              {/* Image selection panel */}
              <ImageSelectionPanel 
                visible={showImagePanel} 
                onClose={() => setShowImagePanel(false)} 
              />
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
          onSendMessage={handleSendMessage}
          placeholder={attachments.length > 0 ? "Add a caption to your image(s) or press Send..." : "Type your message or paste an image..."}
          disabled={isLoading}
          isSelectionActive={!!currentSelection}
        />
      </InputContainer>
    </ChatContainer>
  );
};

// Export the wrapped component
export const ChatInterface = SelectionWrapper; 