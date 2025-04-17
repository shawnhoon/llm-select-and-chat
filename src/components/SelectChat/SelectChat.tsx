import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { SelectChatProps, Conversation, Selection, UserPreferences, Message, LLMProvider, Attachment } from '../../types';
import { createTheme } from '../../utils/theme';
import { GlobalStyle } from '../../utils/theme';
import { ChatInterface } from '../ChatInterface';
import { LLMAdapterFactory } from '../LLMProviderAdapter';
import { SelectionCaptureProvider } from '../SelectionCapture';
import { uuid } from '../../utils/uuid';

const SelectChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
`;

/**
 * SelectChat Component
 * 
 * A modular chat component that can be integrated into any web application.
 * It allows users to select text on a webpage and chat about it with an AI assistant.
 */
export const SelectChat: React.FC<SelectChatProps> = ({
  apiKey,
  provider: initialProvider,
  theme = 'system',
  userPreferences: initialPreferences,
  onSelectionCapture,
  onConversationUpdate,
  onError
}) => {
  // State management
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : (theme as 'light' | 'dark')
  );
  
  // Add state for current provider
  const [currentProvider, setCurrentProvider] = useState<LLMProvider | undefined>(initialProvider);
  
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
  
  // Create theme object
  const themeObject = createTheme(themeMode);
  
  // Handle changing the LLM provider
  const handleProviderChange = (newProvider: LLMProvider) => {
    // Log provider change with better formatting
    console.log('%c🔄 CHANGING LLM PROVIDER', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
    
    if (apiKey && !currentProvider) {
      console.log('%cSwitching from default OpenAI to custom provider', 'font-weight: bold;');
    } else if (currentProvider) {
      console.log('%cFrom:', 'font-weight: bold;', `${currentProvider.type} / ${currentProvider.defaultParams.model} (temp: ${currentProvider.defaultParams.temperature || 'default'})`);
    }
    
    console.log('%cTo:', 'font-weight: bold;', `${newProvider.type} / ${newProvider.defaultParams.model} (temp: ${newProvider.defaultParams.temperature || 'default'})`);
    
    // Save API key to localStorage
    try {
      // Get existing keys or initialize empty object
      const savedKeys = localStorage.getItem('llm-select-chat-api-keys');
      const allKeys = savedKeys ? JSON.parse(savedKeys) : {};
      
      // Update with new key
      allKeys[newProvider.type] = newProvider.apiKey;
      
      // Save back to localStorage
      localStorage.setItem('llm-select-chat-api-keys', JSON.stringify(allKeys));
      console.log('Saved API key for', newProvider.type, 'to localStorage');
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
    
    // Update current provider
    setCurrentProvider(newProvider);
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    try {
      // Create user message with selection and attachments
      const userMessage: Message = {
        id: uuid(),
        role: 'user',
        content,
        timestamp: Date.now(),
        ...(selection && { selection }), // Include selection with user message
        ...(attachments && attachments.length > 0 && { attachments }) // Include attachments if present
      };
      
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
  
  // Handle selection capture from the SelectionCaptureProvider
  const handleSelectionCapture = (newSelection: Selection) => {
    console.log('Selection captured:', newSelection);
    setSelection(newSelection);
    
    // Notify parent component if callback is provided
    if (onSelectionCapture) {
      onSelectionCapture(newSelection);
    }
    
    // Only update the conversation's updatedAt timestamp
    const updatedConversation = {
      ...conversation,
      updatedAt: Date.now()
    };
    
    if (onConversationUpdate) {
      onConversationUpdate(updatedConversation);
    }
  };

  return (
    <ThemeProvider theme={themeObject}>
      <GlobalStyle theme={themeObject} />
      <SelectChatContainer>
        <SelectionCaptureProvider onTextSelected={handleSelectionCapture}>
          <ChatInterface
            conversation={conversation}
            userPreferences={preferences}
            llmProvider={currentProvider}
            selection={selection}
            onSendMessage={handleSendMessage}
            onNewConversation={handleNewConversation}
            onError={onError}
            onProviderChange={handleProviderChange}
          />
        </SelectionCaptureProvider>
      </SelectChatContainer>
    </ThemeProvider>
  );
}; 