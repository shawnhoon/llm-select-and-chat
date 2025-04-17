import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Conversation, LLMProvider, Message, Selection, UserPreferences } from '../../types';
import { generateId } from '../../utils/id';

// Define the context type
export interface StateContextType {
  // Messages and conversations
  currentConversation: Conversation | null;
  messages: Message[];
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  
  // Selection
  currentSelection: Selection | null;
  setCurrentSelection: (selection: Selection | null) => void;
  
  // Preferences and configuration
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  
  // Providers and API
  apiKey: string | null;
  providers: LLMProvider[];
  isLoading: boolean;
  error: string | null;
}

// Create the context
const StateContext = createContext<StateContextType | undefined>(undefined);

// Hook for using the context
export const useStateContext = (): StateContextType => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
};

// Provider props
interface StateProviderProps {
  children: ReactNode;
  apiKey?: string;
  proxyUrl?: string;
  useServerCredentials?: boolean;
  providers?: Partial<LLMProvider>[];
  preferences?: Partial<UserPreferences>;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
}

// State Provider Component
export const StateProvider: React.FC<StateProviderProps> = ({
  children,
  apiKey,
  proxyUrl,
  useServerCredentials = false,
  providers = [],
  preferences: initialPreferences,
  onMessageSent,
  onMessageReceived
}) => {
  // State
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize providers and preferences
  const [availableProviders, setAvailableProviders] = useState<LLMProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      apiKey: apiKey || '',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 },
        { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 }
      ],
      defaultParams: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
      }
    }
  ]);
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'light',
    selectedProvider: 'openai',
    position: 'right',
    ...(initialPreferences || {})
  });
  
  // Update preferences
  const updatePreferences = useCallback((newPrefs: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);
  
  // Start a new conversation when a selection is made
  useEffect(() => {
    if (currentSelection && (!currentConversation || currentConversation.context !== currentSelection)) {
      const newConversation: Conversation = {
        id: generateId(),
        messages: [],
        context: currentSelection,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setCurrentConversation(newConversation);
    }
  }, [currentSelection, currentConversation]);
  
  // Mock function to simulate sending a message to an API
  const sendMessage = useCallback(async (content: string, attachments: any[] = []) => {
    if (!currentConversation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create user message
      const userMessage: Message = {
        id: generateId(),
        content,
        role: 'user',
        timestamp: Date.now(),
        attachments
      };
      
      // Add user message to conversation
      setCurrentConversation(prev => {
        if (!prev) return null;
        const updatedMessages = [...prev.messages, userMessage];
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      });
      
      // Notify about sent message
      if (onMessageSent) {
        onMessageSent(userMessage);
      }
      
      // Mock API response (replace with actual API call)
      // In a real implementation, this would call the OpenAI API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create assistant response
      const assistantMessage: Message = {
        id: generateId(),
        content: `I'm the SelectChat AI assistant. You selected: "${currentSelection?.text}". 
                  This is a placeholder response since we're still implementing the actual API integration.`,
        role: 'assistant',
        timestamp: Date.now()
      };
      
      // Add assistant message to conversation
      setCurrentConversation(prev => {
        if (!prev) return null;
        const updatedMessages = [...prev.messages, assistantMessage];
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      });
      
      // Notify about received message
      if (onMessageReceived) {
        onMessageReceived(assistantMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, currentSelection, onMessageSent, onMessageReceived]);
  
  // Prepare messages array from current conversation
  const messages = currentConversation?.messages || [];
  
  // Provider value
  const value: StateContextType = {
    currentConversation,
    messages,
    sendMessage,
    currentSelection,
    setCurrentSelection,
    preferences: userPreferences,
    updatePreferences,
    apiKey: apiKey || null,
    providers: availableProviders,
    isLoading,
    error
  };
  
  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
}; 