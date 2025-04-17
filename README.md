# LLM Select and Chat

A flexible and customizable React component for selecting text on a webpage and chatting with an LLM (Large Language Model) assistant about it.

## Features

- 🎨 Fully themeable and customizable chat interface
- 🔍 Smart text selection capture
- 🤖 Integrates with multiple LLM providers (OpenAI, Gemini)
- 📱 Responsive design that works on desktop and mobile
- 🌗 Light and dark mode support
- 🔄 Real-time conversation updates
- 🔒 Secure API key handling options
- ⚛️ Built with React and TypeScript

## Installation

```bash
npm install llm-select-and-chat
# or
yarn add llm-select-and-chat
```

## Quick Start

### React Usage

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
```

### Vanilla JavaScript Usage

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
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | `undefined` | API key for the LLM provider (OpenAI by default) |
| `provider` | `LLMProvider` | OpenAI config | Configuration for the LLM provider |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | UI theme |
| `userPreferences` | `UserPreferences` | Default preferences | User-specific settings |
| `onSelectionCapture` | `(selection: Selection) => void` | `undefined` | Callback when text is selected |
| `onConversationUpdate` | `(conversation: Conversation) => void` | `undefined` | Callback when conversation changes |
| `onError` | `(error: Error) => void` | `undefined` | Callback for error handling |

## Customizing the LLM Provider

You can use different LLM providers by configuring the `provider` prop:

```jsx
<SelectChat
  provider={{
    type: 'openai', // or 'gemini', 'custom'
    apiKey: 'your-api-key',
    baseUrl: 'https://api.openai.com', // optional, use for proxies
    defaultParams: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    }
  }}
/>
```

## Theme Customization

The component supports full theme customization:

```jsx
import { SelectChat, createTheme } from 'llm-select-and-chat';

// Create a custom theme
const customTheme = createTheme('light');
customTheme.colors.primary = '#8A2BE2'; // blueviolet
customTheme.colors.background = '#FAFAFA';

function App() {
  return (
    <div style={{ width: '400px', height: '600px' }}>
      <ThemeProvider theme={customTheme}>
        <SelectChat apiKey="your-api-key" />
      </ThemeProvider>
    </div>
  );
}
```

## Server-Side Proxy for API Key Security

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
