# LLM Select and Chat Usage Guide

## Table of Contents

- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Provider Configuration](#provider-configuration)
- [Theming](#theming)
- [Handling User Selections](#handling-user-selections)
- [Image Support](#image-support)
- [Vanilla JavaScript API](#vanilla-javascript-api)
- [Advanced Examples](#advanced-examples)
- [Programmatic Control API](#programmatic-control-api)

## Basic Usage

```jsx
import React from 'react';
import { SelectChat } from 'llm-select-and-chat';

function App() {
  return (
    <div style={{ height: '600px', width: '400px' }}>
      <SelectChat 
        apiKey="your-openai-api-key"
        theme="light"
        userPreferences={{
          showTimestamps: true,
          codeHighlighting: true
        }}
      />
    </div>
  );
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | `undefined` | API key for the LLM provider (OpenAI by default) |
| `provider` | `LLMProvider` | OpenAI config | Configuration for the LLM provider |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | UI theme |
| `customTheme` | `ThemeProps` | `undefined` | Custom theme overrides |
| `userPreferences` | `UserPreferences` | See below | User-specific settings |
| `systemPromptConfig` | `string \| object` | Standard prompt | Custom system prompt |
| `extractFullDocument` | `boolean` | `false` | Extract full document text for context |
| `onSelectionCapture` | `(selection: Selection) => void` | `undefined` | Callback when text is selected |
| `onConversationUpdate` | `(conversation: Conversation) => void` | `undefined` | Callback when conversation changes |
| `onError` | `(error: Error) => void` | `undefined` | Callback for error handling |
| `onInit` | `(api: { setSelection: (selection: Selection) => void; clearSelection: () => void; focusInput: () => void; isReady: () => boolean; }) => void` | `undefined` | Callback that provides access to the component's API for programmatic control |
| `onSelectionChange` | `(selection: Selection \| null) => void` | `undefined` | Callback triggered when the selection changes, either programmatically or through user interaction |

### UserPreferences Options

```typescript
interface UserPreferences {
  showTimestamps?: boolean; // Show message timestamps
  darkMode?: boolean; // Force dark mode (overrides theme)
  fontSize?: 'small' | 'medium' | 'large'; // Font size for messages
  useSystemTheme?: boolean; // Use system theme preference
  codeHighlighting?: boolean; // Highlight code blocks in messages
  maxContextLength?: number; // Maximum length of selection context
  historyLength?: number; // Number of messages to keep in history
}
```

## Provider Configuration

Configure different LLM providers:

```jsx
<SelectChat
  provider={{
    type: 'openai', // or 'gemini', 'claude', 'custom'
    apiKey: 'your-api-key',
    baseUrl: 'https://api.openai.com', // optional, for proxies
    defaultParams: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    }
  }}
/>
```

### Supported Providers

- **OpenAI**: GPT models
- **Gemini**: Google's Gemini/PaLM models
- **Claude**: Anthropic's Claude models
- **Custom**: Implement your own provider

### Securing API Keys

For production applications, use a server-side proxy to protect your API keys:

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

## Theming

### Using Built-in Themes

```jsx
<SelectChat theme="dark" />
```

### Custom Theme

```jsx
import { SelectChat, createTheme, ThemeProvider } from 'llm-select-and-chat';

function App() {
  const customTheme = createTheme('light');
  
  // Customize theme properties
  customTheme.colors.primary = '#4a90e2';
  customTheme.colors.background = '#f9f9f9';
  customTheme.fontSizes.medium = '16px';
  customTheme.spacing.md = '12px';
  
  return (
    <ThemeProvider theme={customTheme}>
      <SelectChat apiKey="your-api-key" />
    </ThemeProvider>
  );
}
```

### Theme Properties

```typescript
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  backgroundLight: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

interface ThemeProps {
  colors: ThemeColors;
  fontSizes: {
    small: string;
    medium: string;
    large: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
}
```

## Handling User Selections

When a user selects text, the component captures both the selection and its surrounding context:

```jsx
<SelectChat
  onSelectionCapture={(selection) => {
    console.log('Selected text:', selection.text);
    console.log('Text before selection:', selection.contextBefore);
    console.log('Text after selection:', selection.contextAfter);
    console.log('Selection location:', selection.location);
  }}
/>
```

The `Selection` object contains:

```typescript
interface Selection {
  text: string;           // The selected text
  contextBefore?: string; // Text before the selection
  contextAfter?: string;  // Text after the selection
  url?: string;           // URL where selection occurred
  location?: string;      // Additional location info
  fullDocument?: string;  // The entire document text (if extractFullDocument is true)
}
```

### Full Document Extraction

By default, the component only captures the text immediately surrounding the selection. For cases where you need the AI to have the full context of the entire page, enable full document extraction:

```jsx
<SelectChat
  apiKey="your-api-key"
  extractFullDocument={true}
  onSelectionCapture={(selection) => {
    // selection.fullDocument will contain the entire document text
    console.log('Full document length:', selection.fullDocument?.length);
  }}
/>
```

This is particularly useful for:
- Document analysis
- PDF processing
- Article summarization
- Any task where global context is important

Note that including the full document may increase token usage when communicating with the LLM.

## Image Support

The component supports pasting images from clipboard:

```jsx
<SelectChat
  onConversationUpdate={(conversation) => {
    // Check for attachments in the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      console.log('Message contains attachments:', lastMessage.attachments);
    }
  }}
/>
```

Attachments are structured as:

```typescript
interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  data?: Blob | string;
  mimeType?: string;
}
```

## Vanilla JavaScript API

For non-React projects, use the vanilla JS API:

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
  
  // You can control the instance programmatically
  chatInstance.clearConversation();
  chatInstance.sendMessage('Hello, AI assistant!');
</script>
```

## Advanced Examples

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

### Using Individual Components

For finer control, you can use the individual components and hooks:

```jsx
import { 
  ChatInterface, 
  useSelectionCapture, 
  SelectionCaptureProvider,
  ThemeProvider,
  createTheme
} from 'llm-select-and-chat';

function CustomChatImplementation() {
  // Set up theme
  const theme = createTheme('dark');
  
  // Initialize selection capture
  const { selection, setSelection } = useSelectionCapture();
  
  // Handle user messages
  const handleSendMessage = (message, attachments) => {
    // Implement your own message handling logic
    console.log('Message:', message);
    console.log('Attachments:', attachments);
    console.log('Selection context:', selection);
    
    // Call your AI service...
  };
  
  return (
    <ThemeProvider theme={theme}>
      <SelectionCaptureProvider>
        <ChatInterface
          conversation={{
            id: 'custom-conversation',
            messages: [], // Your message state
            createdAt: Date.now(),
            updatedAt: Date.now()
          }}
          selection={selection}
          onSendMessage={handleSendMessage}
          onNewConversation={() => {/* Clear conversation state */}}
        />
      </SelectionCaptureProvider>
    </ThemeProvider>
  );
}
```

This approach gives you complete control over the conversation state and AI service integration. 

## Programmatic Control API

The `SelectChat` component provides a programmatic API for controlling its behavior from parent components. This is particularly useful for integrating with PDF viewers or other document interfaces where you need to programmatically set selections.

### Initializing the API

To access the component's API, use the `onInit` callback prop:

```jsx
import React, { useState } from 'react';
import { SelectChat } from 'llm-select-and-chat';

function App() {
  const [chatApi, setChatApi] = useState(null);
  
  return (
    <div style={{ height: '600px', width: '400px' }}>
      <SelectChat 
        apiKey="your-openai-api-key"
        onInit={(api) => {
          setChatApi(api);
          console.log('Chat API initialized and ready');
        }}
      />
      
      {/* Now you can use chatApi to control the component */}
      <button 
        disabled={!chatApi?.isReady()} 
        onClick={() => chatApi.focusInput()}
      >
        Focus Chat Input
      </button>
    </div>
  );
}
```

### Available API Methods

The API object provides the following methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `setSelection` | `(selection: Selection) => void` | Programmatically set a selection in the chat |
| `clearSelection` | `() => void` | Clear the current selection |
| `focusInput` | `() => void` | Focus the chat input field |
| `isReady` | `() => boolean` | Check if the component is initialized and ready |

### Tracking Selection Changes

Use the `onSelectionChange` callback to be notified when selections change, either programmatically or through user interaction:

```jsx
<SelectChat
  apiKey="your-openai-api-key"
  onInit={(api) => setChatApi(api)}
  onSelectionChange={(selection) => {
    // Called when selection changes (can be null if cleared)
    console.log('Current selection:', selection);
    
    // Update UI or state based on selection
    setHighlightedText(selection?.text || '');
  }}
/>
```

### PDF Viewer Integration Example

Here's an example of integrating `SelectChat` with a PDF viewer component:

```jsx
import React, { useState, useEffect } from 'react';
import { SelectChat } from 'llm-select-and-chat';
import { PDFViewer } from 'your-pdf-library';

function PDFChatApp() {
  const [chatApi, setChatApi] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  
  const handleDocumentLoad = (document) => {
    setPdfDocument(document);
  };
  
  const handleTextSelection = (selection) => {
    if (chatApi?.isReady()) {
      // Convert PDF selection to SelectChat Selection format
      const chatSelection = {
        text: selection.text,
        contextBefore: selection.paragraphBefore || '',
        contextAfter: selection.paragraphAfter || '',
        url: window.location.href,
        location: `page ${selection.pageNumber}`
      };
      
      // Set the selection in the chat component
      chatApi.setSelection(chatSelection);
    }
  };
  
  return (
    <div className="pdf-chat-container">
      <div className="pdf-viewer">
        <PDFViewer
          url="/path/to/document.pdf"
          onDocumentLoad={handleDocumentLoad}
          onTextSelection={handleTextSelection}
        />
      </div>
      
      <div className="chat-panel">
        <SelectChat
          apiKey="your-openai-api-key"
          onInit={(api) => setChatApi(api)}
          onSelectionChange={(selection) => {
            // Optionally highlight the selection in the PDF viewer
            if (selection && pdfDocument) {
              pdfDocument.highlightText(selection.text);
            }
          }}
        />
      </div>
    </div>
  );
}
```

### Best Practices

When using the programmatic API, consider these best practices:

1. **Check component readiness**: Always verify the component is ready using `isReady()` before calling other methods
   
2. **Provide complete context**: When setting selections programmatically, include as much context as possible (text before/after) for better AI responses
   
3. **Handle errors gracefully**: Use the `onError` callback along with the API to handle error scenarios
   
4. **Focus management**: Use `focusInput()` after setting a selection to provide a seamless user experience
   
5. **Selection format consistency**: Ensure programmatically set selections follow the same format as user-made selections:

```typescript
// Complete Selection object format
{
  text: string;           // The selected text (required)
  contextBefore?: string; // Text before the selection
  contextAfter?: string;  // Text after the selection
  url?: string;           // URL or identifier for the source
  location?: string;      // Human-readable location (e.g., "page 5")
  fullDocument?: string;  // Full document text if available
}
```

6. **Memory management**: The API object will be invalidated on component unmount. Always check `isReady()` before using the API, especially after component re-renders.

7. **Two-way communication**: Use both the API methods and the callbacks (`onSelectionChange`, `onConversationUpdate`) to create bidirectional communication between your app and the chat component. 