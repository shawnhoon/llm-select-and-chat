import React, { useState, useEffect, useRef } from 'react';
// Version: 1.0.1 - Context Preservation Fix (2024-05-29)
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { SelectChatProps, Conversation, Selection, UserPreferences, Message, LLMProvider, Attachment } from '../../types';
import { createTheme, ThemeProps } from '../../utils/theme';
import { GlobalStyle } from '../../utils/theme';
import { ChatInterface } from '../ChatInterface';
import { LLMAdapterFactory } from '../LLMProviderAdapter';
import { SelectionCaptureProvider } from '../SelectionCapture';
import { uuid } from '../../utils/uuid';
import { enhanceProviderWithSystemPrompt, SystemPromptConfig } from '../../utils/configLoader';
import { getSystemPrompt } from '../../config';

const SelectChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  color: ${props => props.theme.colors.text}; /* Explicit text color */
`;

// Additional global styles to enforce theme colors more strongly
const EnhancedGlobalStyle = createGlobalStyle<{ theme: ThemeProps }>`
  .select-chat-container *,
  .select-chat-container *::before,
  .select-chat-container *::after {
    color: ${({ theme }) => theme.colors.text};
  }
  
  /* Higher specificity for text elements */
  .select-chat-container p,
  .select-chat-container h1,
  .select-chat-container h2,
  .select-chat-container h3,
  .select-chat-container h4,
  .select-chat-container h5,
  .select-chat-container h6,
  .select-chat-container span,
  .select-chat-container div,
  .select-chat-container label {
    color: ${({ theme }) => theme.colors.text};
  }
  
  /* Input field text colors */
  .select-chat-container input,
  .select-chat-container textarea,
  .select-chat-container select {
    color: ${({ theme }) => theme.colors.text};
  }
  
  /* Button text colors */
  .select-chat-container button:not([class*="primary"]) {
    color: ${({ theme }) => theme.colors.text};
  }
  
  /* Primary buttons get the on-primary text color */
  .select-chat-container button[class*="primary"] {
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }
  
  /* Message bubbles enforce their colors more strongly */
  .select-chat-container [class*="message-bubble"] {
    color: ${({ theme }) => theme.colors.text} !important;
  }
  
  /* Primary elements */
  .select-chat-container [class*="primary"] {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }
`;

/**
 * Helper function to perform a deep merge of objects
 */
const deepMerge = (target: any, source: any): any => {
  const output = {...target};
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

/**
 * Helper function to check if a value is an object
 */
const isObject = (item: any): boolean => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * SelectChat Component
 * 
 * A modular chat component that can be integrated into any web application.
 * It allows users to select text on a webpage and chat about it with an AI assistant.
 * 
 * @param apiKey - Optional API key for the LLM provider
 * @param provider - Optional LLM provider configuration
 * @param theme - Optional theme mode: 'light', 'dark', or 'system' (default)
 * @param customTheme - Optional custom theme properties that override the default theme
 * @param userPreferences - Optional user preferences for UI customization
 * @param systemPromptConfig - Optional custom system prompt configuration
 * @param extractFullDocument - Optional flag to extract full document context
 * @param onSelectionCapture - Optional callback when text is selected
 * @param onConversationUpdate - Optional callback when conversation is updated
 * @param onError - Optional callback when an error occurs
 * @param onInit - Optional callback when the component is initialized
 * @param onSelectionChange - Optional callback when the selection changes
 */
export const SelectChat: React.FC<SelectChatProps> = ({
  apiKey,
  provider: initialProvider,
  theme = 'system',
  customTheme,
  userPreferences: initialPreferences,
  systemPromptConfig,
  extractFullDocument = false,
  onSelectionCapture,
  onConversationUpdate,
  onError,
  onInit,
  onSelectionChange
}) => {
  // State management
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : (theme as 'light' | 'dark')
  );
  
  // Input reference for focusing
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Track component readiness state
  const [isReady, setIsReady] = useState(false);
  
  // Use default system prompt if not provided
  const effectiveSystemPrompt = systemPromptConfig || getSystemPrompt('standard', false);
  
  // Enhance the provider with system prompt configuration if provided
  const enhancedInitialProvider = initialProvider 
    ? enhanceProviderWithSystemPrompt(initialProvider, effectiveSystemPrompt)
    : initialProvider;
  
  // Add state for current provider
  const [currentProvider, setCurrentProvider] = useState<LLMProvider | undefined>(enhancedInitialProvider);
  
  const [conversation, setConversation] = useState<Conversation>({
    id: uuid(),
    title: 'New Conversation',
    messages: [],
    annotations: [],
    attachments: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  
  const [selection, setSelection] = useState<Selection | null>(null);
  
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || {
      showTimestamps: true
    }
  );
  
  // Load saved API keys from localStorage
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('llm-select-chat-api-keys');
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        console.log('Loaded saved API keys from localStorage');
        
        // If we have a provider but no API key, and there's a saved key for that provider type
        if (currentProvider && !currentProvider.apiKey && parsedKeys[currentProvider.type]) {
          console.log('Using saved API key for', currentProvider.type);
          // Update the provider with the saved API key
          const providerWithKey = {
            ...currentProvider,
            apiKey: parsedKeys[currentProvider.type]
          };
          // We'll need to notify the parent component of this update
          if (onConversationUpdate) {
            onConversationUpdate({
              ...conversation,
              updatedAt: Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading API keys from localStorage:', error);
    }
  }, []);
  
  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = (e: MediaQueryListEvent) => {
        setThemeMode(e.matches ? 'dark' : 'light');
      };
      
      darkModeMediaQuery.addEventListener('change', handleThemeChange);
      
      return () => {
        darkModeMediaQuery.removeEventListener('change', handleThemeChange);
      };
    }
  }, [theme]);
  
  // Update preferences when props change
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...initialPreferences
      }));
    }
  }, [initialPreferences]);
  
  // Add effect to log provider changes
  useEffect(() => {
    if (currentProvider) {
      console.log('%c🔍 CURRENT PROVIDER STATE', 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
      console.log('Type:', currentProvider.type);
      console.log('Model:', currentProvider.defaultParams.model);
      console.log('API Key:', currentProvider.apiKey ? '✓ Set' : '✗ Not set');
    }
  }, [currentProvider]);
  
  // Update theme mode when theme prop changes
  useEffect(() => {
    if (theme !== 'system') {
      setThemeMode(theme as 'light' | 'dark');
      console.log('Theme mode updated from props:', theme);
    }
  }, [theme]);
  
  // Create theme object
  const baseThemeObject = createTheme(themeMode);
  
  // Merge with custom theme if provided using proper deep merge
  const themeObject = customTheme 
    ? deepMerge(baseThemeObject, customTheme)
    : baseThemeObject;
    
  // Log theme changes for debugging
  useEffect(() => {
    console.log('SelectChat component theme updated:');
    console.log('Theme mode:', themeMode);
    console.log('Using custom theme:', !!customTheme);
    console.log('Theme colors:', themeObject.colors);
  }, [themeMode, customTheme]);
  
  // Create initial LLM provider
  useEffect(() => {
    try {
      // Always use a defined system prompt - either the one provided or the standard default
      const effectiveSystemPrompt = systemPromptConfig || getSystemPrompt('standard', false);
      
      // Always enhance the provider with the system prompt
      const enhancedProvider = initialProvider 
        ? enhanceProviderWithSystemPrompt(initialProvider, effectiveSystemPrompt)
        : undefined; // Use undefined instead of null to match state type
        
      setCurrentProvider(enhancedProvider);
      
      // Log for debugging
      console.log('🧠 Provider initialized with system prompt:', 
        effectiveSystemPrompt, 
        enhancedProvider?.systemPrompt?.template ? 'Template applied successfully' : 'Using default template');
        
    } catch (error) {
      console.error('Error initializing provider:', error);
    }
  }, [initialProvider, systemPromptConfig]);
  
  // Update provider when API key changes
  useEffect(() => {
    if (!currentProvider || apiKey === currentProvider.apiKey) return;
    
    try {
      // Get the current system prompt config from the existing provider or use the default
      const currentSystemPrompt = systemPromptConfig || 
        (currentProvider.systemPrompt || getSystemPrompt('standard', false));
      
      // Create a new provider with the updated API key
      // Ensure apiKey is not undefined
      if (!apiKey) return;
      
      const newProvider = {
        ...currentProvider,
        apiKey: apiKey // Ensure apiKey is a string
      };
      
      // Always reapply the system prompt when creating a new provider
      const enhancedProvider = enhanceProviderWithSystemPrompt(newProvider, currentSystemPrompt);
      setCurrentProvider(enhancedProvider);
      
      // Log for debugging
      console.log('🔑 Provider updated with new API key and system prompt reapplied');
      
    } catch (error) {
      console.error('Error updating provider with new API key:', error);
    }
  }, [apiKey, currentProvider, systemPromptConfig]);
  
  // Expose API via onInit
  useEffect(() => {
    if (onInit) {
      onInit({
        setSelection: (newSelection: Selection) => {
          console.log('Selection set programmatically:', newSelection);
          setSelection(newSelection);
          setTimeout(() => inputRef.current?.focus(), 100);
        },
        clearSelection: () => setSelection(null),
        focusInput: () => inputRef.current?.focus(),
        isReady: () => isReady
      });
    }
    
    // Mark component as ready
    setIsReady(true);
    
    return () => {
      // Clean up on unmount
      setIsReady(false);
    };
  }, [onInit]);
  
  // Notify about selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
  }, [selection, onSelectionChange]);
  
  // Handle selection capture from the SelectionCaptureProvider
  const handleSelectionCapture = (newSelection: Selection) => {
    console.log('%c SELECTION CAPTURED - v1.0.1', 'background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('Selection text:', newSelection.text?.substring(0, 100) + (newSelection.text?.length > 100 ? '...' : ''));
    console.log('Context before length:', newSelection.contextBefore?.length || 0);
    console.log('Context after length:', newSelection.contextAfter?.length || 0);
    console.log('Context before (first 50 chars):', newSelection.contextBefore?.substring(0, 50));
    console.log('Context after (first 50 chars):', newSelection.contextAfter?.substring(0, 50));
    console.log('URL:', newSelection.url);
    console.log('Location:', newSelection.location);
    
    // Add logging for full document context
    console.log('%c📄 DOCUMENT CONTEXT', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('Has full document:', !!newSelection.fullDocument);
    if (newSelection.fullDocument) {
      console.log('Full document length:', newSelection.fullDocument.length);
      console.log('Full document preview:', newSelection.fullDocument.substring(0, 150) + '...');
    }
    
    console.log('Full selection object:', newSelection);
    console.log('Selection object keys:', Object.keys(newSelection).join(', '));
    
    // Create a deep copy of the selection to avoid reference issues
    const selectionCopy: Selection = {
      text: newSelection.text || '',
      contextBefore: newSelection.contextBefore || '',
      contextAfter: newSelection.contextAfter || '',
      url: newSelection.url || '',
      location: newSelection.location || '',
      fullDocument: newSelection.fullDocument || ''
    };
    
    console.log('Created selection copy with keys:', Object.keys(selectionCopy).join(', '));
    console.log('Copy context before length:', selectionCopy.contextBefore?.length || 0);
    console.log('Copy context after length:', selectionCopy.contextAfter?.length || 0);
    console.log('Context before sample:', selectionCopy.contextBefore?.substring(0, 50) + '...');
    console.log('Context after sample:', selectionCopy.contextAfter?.substring(0, 50) + '...');
    
    // Notify parent component if callback is provided and use the returned selection if available
    let finalSelection = selectionCopy;
    if (onSelectionCapture) {
      try {
        const enhancedSelection = onSelectionCapture(selectionCopy);
        // If a selection object was returned (not undefined or void)
        if (enhancedSelection && typeof enhancedSelection === 'object' && 'text' in enhancedSelection) {
          console.log('%c SELECTION ENHANCED BY CALLBACK', 'background: #FF5722; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
          console.log('Enhanced selection has fullDocument:', !!enhancedSelection.fullDocument);
          if (enhancedSelection.fullDocument) {
            console.log('Enhanced fullDocument length:', enhancedSelection.fullDocument.length);
            console.log('Enhanced fullDocument preview:', enhancedSelection.fullDocument.substring(0, 150) + '...');
          }
          finalSelection = enhancedSelection;
        }
      } catch (error) {
        console.error('Error in onSelectionCapture callback:', error);
      }
    }
    
    // Use the potentially enhanced selection
    setSelection(finalSelection);
    
    // Only update the conversation's updatedAt timestamp
    const updatedConversation = {
      ...conversation,
      updatedAt: Date.now()
    };
    
    if (onConversationUpdate) {
      onConversationUpdate(updatedConversation);
    }
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    try {
      // Add detailed logging for the selection object before sending to LLM
      if (selection) {
        console.log('%c🔍 SELECTION BEING SENT TO LLM (v1.0.1)', 'background: #E91E63; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
        console.log('Selection text:', selection.text?.substring(0, 100) + (selection.text?.length > 100 ? '...' : ''));
        console.log('Context before length:', selection.contextBefore?.length || 0);
        console.log('Context after length:', selection.contextAfter?.length || 0);
        console.log('Context before (first 50 chars):', selection.contextBefore?.substring(0, 50));
        console.log('Context after (first 50 chars):', selection.contextAfter?.substring(0, 50));
        console.log('URL:', selection.url);
        console.log('Location:', selection.location);
        
        // Add detailed property inspection
        console.log('Selection object properties:');
        Object.entries(selection).forEach(([key, value]) => {
          if (typeof value === 'string') {
            console.log(`- ${key}: ${value.length} chars${value.length > 0 ? ` (sample: "${value.substring(0, Math.min(30, value.length))}${value.length > 30 ? '...' : ''}")` : ''}`);
          } else {
            console.log(`- ${key}: ${value}`);
          }
        });
        
        // Add logging for full document context
        console.log('%c📄 DOCUMENT CONTEXT BEING SENT TO LLM', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
        console.log('Has full document:', !!selection.fullDocument);
        if (selection.fullDocument) {
          console.log('Full document length:', selection.fullDocument.length);
          console.log('Full document preview:', selection.fullDocument.substring(0, 150) + '...');
        }
        
        console.log('Full selection object being sent to LLM:', selection);
      } else {
        console.log('%c🔍 NO SELECTION AVAILABLE', 'background: #607D8B; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
      }

      // Create user message with selection and attachments
      const userMessage: Message = {
        id: uuid(),
        role: 'user',
        content,
        timestamp: Date.now(),
        ...(selection && { selection }), // Include selection with user message
        ...(attachments && attachments.length > 0 && { attachments }) // Include attachments if present
      };
      
      console.log('%c📝 USER MESSAGE CREATED', 'background: #00BCD4; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
      console.log('Message content:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
      console.log('Has selection:', !!userMessage.selection);
      console.log('Has attachments:', !!userMessage.attachments);
      console.log('Full message object:', userMessage);
      
      // Update conversation with user message
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: Date.now()
      };
      
      setConversation(updatedConversation);
      
      if (onConversationUpdate) {
        onConversationUpdate(updatedConversation);
      }
      
      // Process the message with the selected LLM provider
      if (currentProvider || apiKey) {
        const llmConfig: LLMProvider = currentProvider || {
          type: 'openai',
          apiKey: apiKey!,
          defaultParams: {
            model: 'o4-mini-2025-04-16',
            temperature: 0.7,
            maxTokens: 1000
          }
        };
        
        // Improved logging for debugging model selection
        console.log('%c🔄 Sending message to LLM', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.log('%cProvider:', 'font-weight: bold;', llmConfig.type);
        console.log('%cModel:', 'font-weight: bold;', llmConfig.defaultParams.model);
        console.log('%cTemperature:', 'font-weight: bold;', llmConfig.defaultParams.temperature || 'default');
        console.log('%cAttachments:', 'font-weight: bold;', attachments?.length || 0);
        
        // Use the adapter factory to get the appropriate adapter
        const adapter = LLMAdapterFactory.createAdapter(llmConfig);
        
        // Add extra debugging for selection being passed to LLM
        console.log('%c📄 FINAL SELECTION BEING PASSED TO LLM ADAPTER', 'background: #673AB7; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
        console.log('Has selection:', !!selection);
        if (selection) {
          console.log('Has fullDocument:', !!selection.fullDocument);
          if (selection.fullDocument) {
            console.log('fullDocument length:', selection.fullDocument.length);
            console.log('fullDocument preview:', selection.fullDocument.substring(0, 150) + '...');
          }
        }
        
        // Get response from LLM - pass the attachments via the messages
        const responseContent = await adapter.sendMessages(
          updatedConversation.messages,
          selection
        );
        
        // Create assistant message with the same selection for context
        const assistantMessage: Message = {
          id: uuid(),
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now(),
          // Remove selection from assistant message to avoid displaying it twice
        };
        
        // Update conversation with assistant message
        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, assistantMessage],
          updatedAt: Date.now()
        };
        
        setConversation(finalConversation);
        
        if (onConversationUpdate) {
          onConversationUpdate(finalConversation);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };
  
  // Handle starting a new conversation
  const handleNewConversation = () => {
    // Clear the selection
    setSelection(null);
    
    const newConversation: Conversation = {
      id: uuid(),
      title: 'New Conversation',
      messages: [],
      annotations: [],
      attachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setConversation(newConversation);
    
    if (onConversationUpdate) {
      onConversationUpdate(newConversation);
    }
  };

  // Handle changing the LLM provider
  const handleProviderChange = (newProvider: LLMProvider) => {
    // Log provider change with better formatting
    console.log('%c🔄 CHANGING LLM PROVIDER', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
    
    // Get the current system prompt config
    const currentSystemPrompt = systemPromptConfig || 
      (currentProvider?.systemPrompt || getSystemPrompt('standard', false));
    
    // Apply system prompt config to the new provider
    const enhancedProvider = enhanceProviderWithSystemPrompt(newProvider, currentSystemPrompt);
    
    if (currentProvider) {
      console.log('%cFrom:', 'font-weight: bold;', `${currentProvider.type} / ${currentProvider.defaultParams.model} (temp: ${currentProvider.defaultParams.temperature || 'default'})`);
    }
    
    console.log('%cTo:', 'font-weight: bold;', `${enhancedProvider.type} / ${enhancedProvider.defaultParams.model} (temp: ${enhancedProvider.defaultParams.temperature || 'default'})`);
    console.log('System prompt template applied:', enhancedProvider.systemPrompt?.template ? 'Yes' : 'No');
    
    // Save API key to localStorage
    try {
      // Get existing keys or initialize empty object
      const savedKeys = localStorage.getItem('llm-select-chat-api-keys');
      const allKeys = savedKeys ? JSON.parse(savedKeys) : {};
      
      // Update with new key
      allKeys[enhancedProvider.type] = enhancedProvider.apiKey;
      
      // Save back to localStorage
      localStorage.setItem('llm-select-chat-api-keys', JSON.stringify(allKeys));
      console.log('Saved API key for', enhancedProvider.type, 'to localStorage');
    } catch (error) {
      console.error('Error saving API key to localStorage:', error);
    }
    
    // Notify parent component if callback exists
    if (onConversationUpdate) {
      // Update conversation with new timestamp to trigger refresh
      const updatedConversation = {
        ...conversation,
        updatedAt: Date.now()
      };
      onConversationUpdate(updatedConversation);
    }
    
    // Update current provider with the enhanced provider
    setCurrentProvider(enhancedProvider);
  };

  return (
    <ThemeProvider theme={themeObject}>
      {/* Apply both global styles */}
      <GlobalStyle theme={themeObject} />
      <EnhancedGlobalStyle theme={themeObject} />
      <SelectChatContainer className="select-chat-container">
        <SelectionCaptureProvider 
          onTextSelected={handleSelectionCapture}
          extractFullDocument={extractFullDocument}
        >
          <ChatInterface
            conversation={conversation}
            userPreferences={preferences}
            llmProvider={currentProvider}
            selection={selection}
            onSendMessage={handleSendMessage}
            onNewConversation={handleNewConversation}
            onError={onError}
            onProviderChange={handleProviderChange}
            inputRef={inputRef}
          />
        </SelectionCaptureProvider>
      </SelectChatContainer>
    </ThemeProvider>
  );
}; 