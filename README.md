# LLM Select and Chat

A flexible React component for text selection and AI chat integration. This package provides an easy way to integrate text selection and AI-powered chat capabilities into your application.

## Features

- 🔍 **Text Selection**: Select text anywhere on your page and discuss it with an AI assistant
- 🖼️ **Image Support**: Paste images directly into the chat input
- 🔄 **Multiple LLM Providers**: Support for OpenAI, Gemini, Claude, and custom providers
- 🎨 **Theming**: Light/dark mode and customizable themes
- 📱 **Responsive**: Works across desktop and mobile
- 🧩 **Modular Design**: Use individual components or the full chat interface

## Installation

```bash
# Install the package
npm install llm-select-and-chat

# Install peer dependencies (if not already in your project)
npm install react react-dom styled-components
```

## Quick Start

```jsx
import React from 'react';
import { SelectChat } from 'llm-select-and-chat';

function App() {
  return (
    <div style={{ height: '600px', width: '400px' }}>
      <SelectChat 
        apiKey="your-openai-api-key"
        theme="light"
      />
    </div>
  );
}
```

## With Custom Theme

```jsx
import React from 'react';
import { SelectChat, createTheme, ThemeProvider } from 'llm-select-and-chat';

function App() {
  const customTheme = createTheme('light');
  customTheme.colors.primary = '#4a90e2';

  return (
    <ThemeProvider theme={customTheme}>
      <SelectChat apiKey="your-api-key" />
    </ThemeProvider>
  );
}
```

## Handling Images

The component supports pasting images directly from clipboard:

1. Copy an image to your clipboard (e.g., take a screenshot)
2. Click on the chat input field
3. Paste using Ctrl+V / Cmd+V
4. Send with or without an accompanying text message

## Selection Context

When text is selected, the component captures context around the selection and makes it available to the AI assistant.

By default, the component only captures the immediate context around the selection. If you need the AI to have access to the entire document, you can enable full document extraction:

```jsx
<SelectChat 
  apiKey="your-openai-api-key"
  extractFullDocument={true}
/>
```

With full document extraction enabled, the complete text content of the page will be included with each selection, giving the AI assistant more comprehensive context.

## Documentation

For complete documentation, including advanced usage and API reference, see [usage.md](./usage.md).

## Examples

The library comes with several examples to help you get started:

### Running the Examples

```bash
# Clone the repository
git clone https://github.com/username/llm-select-and-chat.git
cd llm-select-and-chat

# Install dependencies and build the library
npm install
npm run build

# Install example dependencies
cd examples
npm install

# Start the example server
npm start
```

Then open your browser to [http://localhost:3000/examples/](http://localhost:3000/examples/)

### Available Examples

1. **Basic Example**: Minimal implementation with default styling
2. **Simple Integration**: Integration into an existing webpage
3. **React Integration**: Usage within a React application

Each example demonstrates different aspects of the library, including custom styling, provider selection, and image handling.

## License

MIT © [Your Name]
