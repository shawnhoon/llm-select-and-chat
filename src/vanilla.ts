import React from 'react';
import ReactDOM from 'react-dom/client';
import { SelectChat } from './components/SelectChat';
import type { SelectChatProps, Selection, Message } from './types';
import { initialize } from './init';

/**
 * Initialize the SelectChat component in a vanilla JS environment
 */
export interface SelectChatInitOptions extends SelectChatProps {
  container: string | HTMLElement;
  systemPromptsPath?: string; // Path to custom system prompts JSON file
  extractFullDocument?: boolean;
}

/**
 * SelectChatInstance provides methods to interact with the mounted component
 */
export interface SelectChatInstance {
  /**
   * Update configuration options
   */
  updateConfig: (options: Partial<SelectChatProps>) => void;
  
  /**
   * Trigger the chat interface with selected text
   */
  triggerChat: (selectedText?: string, contextBefore?: string, contextAfter?: string) => void;
  
  /**
   * Add an event listener
   */
  on: (eventName: 'message' | 'response' | 'selection' | 'error', callback: (data: any) => void) => void;
  
  /**
   * Remove an event listener
   */
  off: (eventName: 'message' | 'response' | 'selection' | 'error', callback: (data: any) => void) => void;
  
  /**
   * Clean up and remove the component
   */
  destroy: () => void;
}

/**
 * Initialize the SelectChat component in a vanilla JS environment
 */
export async function initSelectChat(options: SelectChatInitOptions): Promise<SelectChatInstance> {
  console.log('🚀 Initializing LLM Select and Chat...');
  
  // Initialize system prompts if path provided
  if (options.systemPromptsPath) {
    try {
      console.log(`📚 Loading system prompts from: ${options.systemPromptsPath}`);
      await initialize({ systemPromptsPath: options.systemPromptsPath });
      
      // Add enhanced debugging for system prompts loading
      // This helps users verify their prompts are correctly loaded
      console.log('✅ System prompts initialized successfully. Attempting to verify...');
      
      // Attempt to get a system prompt to validate loading
      const { getSystemPrompt } = await import('./config/systemPrompts');
      const standardPrompt = getSystemPrompt('standard', false);
      
      if (standardPrompt?.template) {
        // Only show a brief snippet of the template to avoid console clutter
        const templatePreview = standardPrompt.template.substring(0, 50) + '...';
        console.log('✅ System prompts verification successful!');
        console.log(`📝 Sample template loaded: ${templatePreview}`);
      } else {
        console.warn('⚠️ System prompts loaded but verification failed. Custom prompts may not be applied correctly.');
      }
      
    } catch (error) {
      console.error('❌ Error loading system prompts:', error);
      console.warn('⚠️ Will use default system prompts instead. Check that your system-prompts.json file exists and is valid JSON.');
    }
  }
  
  // Log whether full document extraction is enabled
  if (options.extractFullDocument) {
    console.log('📄 Full document extraction: ENABLED - This will capture the entire document text for context');
  }
  
  // Find the container element
  const containerElement = typeof options.container === 'string'
    ? document.querySelector(options.container)
    : options.container;
    
  if (!containerElement) {
    throw new Error(`Container element not found: ${options.container}`);
  }
  
  // Create a root element for React
  const root = ReactDOM.createRoot(containerElement as HTMLElement);
  
  // Store event listeners
  const eventListeners: Record<string, Array<(data: any) => void>> = {};
  
  // Current options state
  let currentOptions = { ...options };
  
  // Render the component
  const render = () => {
    const { container, ...props } = currentOptions;
    
    root.render(
      React.createElement(SelectChat, {
        ...props,
        onSelectionCapture: (selection: Selection) => {
          triggerEvent('selection', selection);
          if (props.onSelectionCapture) props.onSelectionCapture(selection);
        },
        onConversationUpdate: (conversation) => {
          // Check if this update contains a new message
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          if (lastMessage) {
            if (lastMessage.role === 'user') {
              triggerEvent('message', lastMessage);
            } else if (lastMessage.role === 'assistant') {
              triggerEvent('response', lastMessage);
            }
          }
          if (props.onConversationUpdate) props.onConversationUpdate(conversation);
        },
        onError: (error) => {
          triggerEvent('error', error);
          if (props.onError) props.onError(error);
        }
      })
    );
  };
  
  // Trigger events
  const triggerEvent = (eventName: string, data: any) => {
    const listeners = eventListeners[eventName] || [];
    listeners.forEach(callback => callback(data));
  };
  
  // Initial render
  render();
  
  // Return the instance interface
  return {
    updateConfig: (newOptions) => {
      currentOptions = { ...currentOptions, ...newOptions };
      render();
    },
    
    triggerChat: (selectedText, contextBefore = '', contextAfter = '') => {
      if (selectedText) {
        const selection: Selection = {
          text: selectedText,
          contextBefore,
          contextAfter,
          url: window.location.href
        };
        
        triggerEvent('selection', selection);
        
        // If we have onSelectionCapture in currentOptions, call it
        if (currentOptions.onSelectionCapture) {
          currentOptions.onSelectionCapture(selection);
        }
      }
    },
    
    on: (eventName, callback) => {
      if (!eventListeners[eventName]) {
        eventListeners[eventName] = [];
      }
      
      eventListeners[eventName].push(callback);
    },
    
    off: (eventName, callback) => {
      if (!eventListeners[eventName]) return;
      
      eventListeners[eventName] = eventListeners[eventName]
        .filter(listener => listener !== callback);
    },
    
    destroy: () => {
      root.unmount();
      
      // Clear all event listeners
      Object.keys(eventListeners).forEach(key => {
        eventListeners[key] = [];
      });
    },
  };
}

// Make it available globally when used via script tag
if (typeof window !== 'undefined') {
  (window as any).LLMSelectAndChat = {
    initSelectChat
  };
}

export default initSelectChat; 