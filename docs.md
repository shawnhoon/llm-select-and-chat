# LLM Select and Chat

A comprehensive React component library that enables users to select text on a webpage and engage in AI-assisted conversations about the selected content. This library provides a fully customizable, responsive, and themeable chat interface that integrates with multiple LLM providers.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [React Integration](#react-integration)
  - [Vanilla JavaScript Integration](#vanilla-javascript-integration)
- [Core Components](#core-components)
- [Configuration Options](#configuration-options)
  - [SelectChat Props](#selectchat-props)
  - [LLM Provider Configuration](#llm-provider-configuration)
  - [User Preferences](#user-preferences)
- [Theme Customization](#theme-customization)
- [Event Handlers and Callbacks](#event-handlers-and-callbacks)
- [Advanced Features](#advanced-features)
  - [Image Uploads](#image-uploads)
  - [Text Selection Context](#text-selection-context)
  - [Conversation Management](#conversation-management)
- [Security Considerations](#security-considerations)
- [API Reference](#api-reference)
- [Examples](#examples)
- [TypeScript Types](#typescript-types)
- [License](#license)

## Installation

Install the package using npm or yarn:

```bash
# Using npm
npm install llm-select-and-chat

# Using yarn
yarn add llm-select-and-chat
```

### Peer Dependencies

This package has the following peer dependencies:

- React (v17.0.0 or later)
- React DOM (v17.0.0 or later)
- Styled Components (v5.0.0 or later)

Ensure these are installed in your project:

```bash
npm install react react-dom styled-components
```

## Quick Start

### React Integration

```jsx
import React from 'react';
import { SelectChat } from 'llm-select-and-chat';

function App() {
  return (
    <div style={{ width: '400px', height: '600px' }}>
      <SelectChat
        apiKey="your-openai-api-key"
        theme="system"
        userPreferences={{
          showTimestamps: true,
          codeHighlighting: true
        }}
        onSelectionCapture={(selection) => console.log('Text selected:', selection)}
        onConversationUpdate={(conversation) => console.log('Conversation updated:', conversation)}
        onError={(error) => console.error('Error:', error)}
      />
    </div>
  );
}

export default App;
```

### Vanilla JavaScript Integration

```html
<div id="chat-container" style="width: 400px; height: 600px;"></div>

<script src="https://unpkg.com/llm-select-and-chat/dist/index.umd.js"></script>
<script>
  const container = document.getElementById('chat-container');
  const chatInstance = LLMSelectAndChat.initSelectChat({
    container: container,
    apiKey: 'your-openai-api-key',
    theme: 'system',
    userPreferences: {
      showTimestamps: true,
      codeHighlighting: true
    },
    onSelectionCapture: (selection) => console.log('Text selected:', selection),
    onError: (error) => console.error('Error:', error)
  });
  
  // You can also listen to events
  chatInstance.on('selection', (selection) => {
    console.log('Selection event:', selection);
  });
  
  chatInstance.on('message', (message) => {
    console.log('Message sent:', message);
  });
  
  chatInstance.on('response', (message) => {
    console.log('Response received:', message);
  });
  
  // Update configuration after initialization
  chatInstance.updateConfig({ apiKey: 'new-api-key' });
  
  // Clean up when needed
  // chatInstance.destroy();
</script>
```

## Core Components

The library exports the following core components:

### SelectChat

The main component that provides both text selection capabilities and a chat interface.

```jsx
import { SelectChat } from 'llm-select-and-chat';

<SelectChat apiKey="your-api-key" theme="light" />
```

### ChatInterface

A standalone chat interface without text selection capture.

```jsx
import { ChatInterface } from 'llm-select-and-chat';

<ChatInterface 
  conversation={conversation}
  onSendMessage={handleSendMessage}
  onNewConversation={handleNewConversation}
  isLoading={loading}
/>
```

### SelectionCaptureProvider

A context provider for text selection functionality.

```jsx
import { SelectionCaptureProvider } from 'llm-select-and-chat';

<SelectionCaptureProvider onSelectionCapture={handleSelection}>
  {children}
</SelectionCaptureProvider>
```

### Message Component

A component to render individual messages.

```jsx
import { MessageComponent } from 'llm-select-and-chat';

<MessageComponent 
  message={message}
  showTimestamp={true}
/>
```

## Configuration Options

### SelectChat Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | `undefined` | API key for the LLM provider (OpenAI by default) |
| `provider` | `LLMProvider` | OpenAI config | Configuration for the LLM provider |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | UI theme |
| `userPreferences` | `UserPreferences` | Default preferences | User-specific settings |
| `onSelectionCapture` | `(selection: Selection) => void` | `undefined` | Callback when text is selected |
| `onConversationUpdate` | `(conversation: Conversation) => void` | `undefined` | Callback when conversation changes |
| `onError` | `(error: Error) => void` | `undefined` | Callback for error handling |

### LLM Provider Configuration

The `provider` prop allows you to configure different LLM providers:

```jsx
<SelectChat
  provider={{
    type: 'openai', // or 'gemini', 'claude', 'custom'
    apiKey: 'your-api-key',
    baseUrl: 'https://api.openai.com', // Optional, use for proxies
    defaultParams: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }}
/>
```

### Supported LLM Providers

The library currently supports the following providers:

- **OpenAI**: Default provider, supports GPT models
- **Gemini**: Google's Gemini models
- **Claude**: Anthropic's Claude models
- **Custom**: Custom implementation for other providers

### User Preferences

Configure user-specific settings:

```jsx
<SelectChat
  userPreferences={{
    showTimestamps: true,
    darkMode: false,
    fontSize: 'medium',
    useSystemTheme: true,
    codeHighlighting: true,
    maxContextLength: 500,
    historyLength: 50
  }}
/>
```

## Theme Customization

The component supports full theme customization using the ThemeProvider from styled-components:

```jsx
import { SelectChat, createTheme } from 'llm-select-and-chat';
import { ThemeProvider } from 'styled-components';

// Create a custom theme
const customTheme = createTheme('light');
customTheme.colors.primary = '#8A2BE2'; // blueviolet
customTheme.colors.background = '#FAFAFA';
customTheme.colors.text = '#333333';
customTheme.colors.secondaryBackground = '#F0F0F0';

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <SelectChat apiKey="your-api-key" />
    </ThemeProvider>
  );
}
```

You can also use the built-in light and dark themes:

```jsx
import { SelectChat, lightTheme, darkTheme } from 'llm-select-and-chat';
import { ThemeProvider } from 'styled-components';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <SelectChat apiKey="your-api-key" />
    </ThemeProvider>
  );
}
```

## Event Handlers and Callbacks

The library provides several event handlers for monitoring and responding to user interactions:

### Text Selection Events

```jsx
<SelectChat
  onSelectionCapture={(selection) => {
    console.log('Selected text:', selection.text);
    console.log('Context before:', selection.contextBefore);
    console.log('Context after:', selection.contextAfter);
  }}
/>
```

### Conversation Updates

```jsx
<SelectChat
  onConversationUpdate={(conversation) => {
    // Save conversation to localStorage or database
    localStorage.setItem('chat_history', JSON.stringify(conversation));
    
    // Track the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    console.log('Latest message:', lastMessage);
  }}
/>
```

### Error Handling

```jsx
<SelectChat
  onError={(error) => {
    // Log errors to your monitoring service
    console.error('Chat component error:', error);
    
    // Display user-friendly message
    notifyUser('An error occurred. Please try again later.');
  }}
/>
```

## Advanced Features

### Image Uploads

The component supports image uploads via clipboard paste:

```jsx
// Images can be pasted directly into the chat input
<SelectChat
  userPreferences={{
    // ... other preferences
  }}
  onConversationUpdate={(conversation) => {
    // Check for attachments in the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      console.log('Message contains attachments:', lastMessage.attachments);
    }
  }}
/>
```

Users can:
1. Copy an image to their clipboard (for example, by taking a screenshot)
2. Paste it directly into the chat input area using Ctrl+V/Cmd+V
3. Optionally add text along with the image
4. Send the message with both image and text

### Text Selection Context

When a user selects text, the component captures the context surrounding the selection:

```jsx
<SelectChat
  onSelectionCapture={(selection) => {
    // The selection object contains:
    // - text: The directly selected text
    // - contextBefore: Text before the selection (configurable length)
    // - contextAfter: Text after the selection (configurable length)
    console.log('Selection context:', selection);
  }}
/>
```

You can configure the maximum context length through user preferences:

```jsx
<SelectChat
  userPreferences={{
    maxContextLength: 500, // Characters to capture before and after selection
  }}
/>
```

### Conversation Management

Methods for managing conversations in the Vanilla JS implementation:

```javascript
// Initialize
const chatInstance = LLMSelectAndChat.initSelectChat({
  container: document.getElementById('chat-container'),
  apiKey: 'your-api-key'
});

// Start a new conversation
chatInstance.newConversation();

// Get the current conversation
const currentConversation = chatInstance.getConversation();

// Send a message programmatically
chatInstance.sendMessage('Hello, AI assistant!');

// Add a system message to set context
chatInstance.addSystemMessage('You are a helpful assistant that specializes in explaining code.');
```

## Security Considerations

### Server-Side Proxy for API Key Security

For production applications, it's recommended to use a server-side proxy to protect your API keys:

1. Set up a proxy server that forwards requests to the LLM provider
2. Configure the component to use your proxy:

```jsx
<SelectChat
  provider={{
    type: 'openai',
    apiKey: '', // No client-side API key needed
    baseUrl: 'https://your-server.com/api/llm-proxy',
    defaultParams: {
      model: 'gpt-3.5-turbo'
    }
  }}
/>
```

Example Express.js proxy implementation:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/llm-proxy', async (req, res) => {
  try {
    // Server-side API key stored securely in environment variables
    const API_KEY = process.env.OPENAI_API_KEY;
    
    // Forward request to OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return the response from OpenAI
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'An error occurred' }
    });
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
```

## API Reference

### Exported Components

```jsx
import { 
  SelectChat,               // Main component with text selection and chat
  ChatInterface,            // Standalone chat interface
  MessageComponent,         // Message renderer
  MessageInput,             // Input field component
  MessageList,              // List of messages component
  SelectionCaptureProvider, // Provider for text selection functionality
  useSelectionCapture,      // Hook for using text selection in custom components
  
  // LLM Provider Adapters
  OpenAIAdapter,            // Adapter for OpenAI API
  GeminiAdapter,            // Adapter for Google Gemini API
  AbstractLLMAdapter,       // Base class for custom adapters
  LLMAdapterFactory,        // Factory for creating adapters
  
  // Theme utilities
  createTheme,              // Create a custom theme
  lightTheme,               // Pre-configured light theme
  darkTheme,                // Pre-configured dark theme
  
  // Vanilla JS initializer
  initSelectChat            // Initialize in vanilla JS environments
} from 'llm-select-and-chat';
```

### Type Definitions

```typescript
// Key type definitions
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  selection?: Selection;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  annotations?: Annotation[];
  attachments?: Attachment[];
  createdAt: number;
  updatedAt: number;
}

export interface Selection {
  text: string;
  contextBefore?: string;
  contextAfter?: string;
  url?: string;
  location?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  data?: Blob | string;
  mimeType?: string;
}

export interface LLMProvider {
  type: 'openai' | 'gemini' | 'claude' | 'custom';
  apiKey: string;
  baseUrl?: string;
  defaultParams: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

export interface UserPreferences {
  showTimestamps?: boolean;
  darkMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  useSystemTheme?: boolean;
  codeHighlighting?: boolean;
  maxContextLength?: number;
  historyLength?: number;
}
```

## Examples

### Basic Example with OpenAI

```jsx
import React from 'react';
import { SelectChat } from 'llm-select-and-chat';

function ChatApp() {
  return (
    <div style={{ height: '600px', width: '350px' }}>
      <SelectChat 
        apiKey="your-openai-api-key"
        theme="system"
      />
    </div>
  );
}
```

### Using Google's Gemini

```jsx
import React from 'react';
import { SelectChat } from 'llm-select-and-chat';

function GeminiChatApp() {
  return (
    <div style={{ height: '600px', width: '350px' }}>
      <SelectChat 
        provider={{
          type: 'gemini',
          apiKey: 'your-gemini-api-key',
          defaultParams: {
            model: 'gemini-pro',
            temperature: 0.7,
            maxTokens: 1000
          }
        }}
        theme="dark"
      />
    </div>
  );
}
```

### Custom Styling

```jsx
import React from 'react';
import { SelectChat, createTheme } from 'llm-select-and-chat';
import { ThemeProvider } from 'styled-components';

function CustomStyledChatApp() {
  // Create a custom purple theme
  const purpleTheme = createTheme('dark');
  purpleTheme.colors.primary = '#9C27B0';
  purpleTheme.colors.secondary = '#E1BEE7';
  purpleTheme.colors.border = '#CE93D8';
  purpleTheme.colors.userMessage = '#D1C4E9';
  purpleTheme.colors.assistantMessage = '#212121';

  return (
    <ThemeProvider theme={purpleTheme}>
      <div style={{ height: '600px', width: '350px' }}>
        <SelectChat 
          apiKey="your-api-key"
          userPreferences={{
            fontSize: 'large',
            codeHighlighting: true,
            showTimestamps: true
          }}
        />
      </div>
    </ThemeProvider>
  );
}
```

### Saving Conversations

```jsx
import React, { useState, useEffect } from 'react';
import { SelectChat } from 'llm-select-and-chat';

function ChatWithHistory() {
  const [conversation, setConversation] = useState(null);
  
  // Load saved conversation from localStorage on component mount
  useEffect(() => {
    const savedConversation = localStorage.getItem('saved_conversation');
    if (savedConversation) {
      try {
        setConversation(JSON.parse(savedConversation));
      } catch (e) {
        console.error('Failed to parse saved conversation:', e);
      }
    }
  }, []);
  
  // Save conversations to localStorage
  const handleConversationUpdate = (updatedConversation) => {
    setConversation(updatedConversation);
    localStorage.setItem('saved_conversation', JSON.stringify(updatedConversation));
  };
  
  return (
    <div style={{ height: '600px', width: '350px' }}>
      <SelectChat 
        apiKey="your-api-key"
        initialConversation={conversation}
        onConversationUpdate={handleConversationUpdate}
      />
    </div>
  );
}
```

## TypeScript Types

All components and functions come with full TypeScript definitions. The main types include:

- `SelectChatProps`: Props for the SelectChat component
- `ChatInterfaceProps`: Props for the ChatInterface component
- `Message`: Structure of a chat message
- `Conversation`: Structure of a full conversation
- `Selection`: Structure of a text selection
- `LLMProvider`: Configuration for an LLM provider
- `UserPreferences`: User preference options
- `Attachment`: Structure for file/image attachments

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 