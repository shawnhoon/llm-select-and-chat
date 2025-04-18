# SelectChat React Example with Theme Customization

This example demonstrates how to use the SelectChat component in a React application with custom themes using the `chatThemer` utility.

## Prerequisites

- Node.js (>= 14.x)
- npm or yarn

## Installation

First, build the main library:

```bash
# From the root of the repository
npm install  # Install dependencies
npm run build  # Build the library
```

Then, install the example dependencies:

```bash
# From the examples/react directory
npm install
```

## Running the Example

1. First, make sure you're in the example directory:
   ```bash
   cd examples/react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

## Using the chatThemer Utility

The `chatThemer.js` file provides a simple way to customize the look and feel of the SelectChat component without dealing with the full complexity of the theme system.

### Basic Usage

```jsx
import { SelectChat } from 'llm-select-and-chat';
import { createChatTheme } from './chatThemer';

// Create a custom theme
const myTheme = createChatTheme({
  baseTheme: 'light',
  textColor: '#333333',               // Main text color
  backgroundColor: '#f9f9f9',         // Background color
  userBubbleColor: '#e3f2fd',         // User message bubbles
  assistantBubbleColor: '#f5f5f5',    // Assistant message bubbles
  primaryColor: '#2196f3',            // Primary accent color
  borderColor: '#e0e0e0'              // Border color
});

// Use it with SelectChat
function App() {
  return (
    <div style={{ width: '400px', height: '600px' }}>
      <SelectChat
        apiKey="your-openai-api-key"
        theme="light"
        customTheme={myTheme}
        userPreferences={{
          showTimestamps: true,
          codeHighlighting: true
        }}
      />
    </div>
  );
}
```

### Advanced Customization

For more specific color overrides, use the `additionalColors` option:

```jsx
const myTheme = createChatTheme({
  baseTheme: 'dark',
  textColor: '#f0f0f0',
  backgroundColor: '#1a1a2e',
  // ...other colors
  additionalColors: {
    secondary: '#ff9800',          // Secondary color
    highlight: '#ffeb3b',          // Highlighting color
    textSecondary: '#cccccc',      // Secondary text color
    surface: '#252540'             // Surface color
  }
});
```

## Theme Switching

The example demonstrates how to implement theme switching. Click the theme dropdown to see how different themes affect the chat interface.

## Color Properties

The most important color properties you can customize:

| Property | Description |
|----------|-------------|
| `textColor` | Main text color throughout the interface |
| `backgroundColor` | Background color of the chat interface |
| `userBubbleColor` | Background color for user message bubbles |
| `assistantBubbleColor` | Background color for assistant message bubbles |
| `primaryColor` | Color for primary UI elements like buttons |
| `borderColor` | Color for borders throughout the interface |

For more detailed customization, see the `additionalColors` object in the example.

## Troubleshooting

If you encounter any issues:

1. Make sure you've built the main library first (`npm run build` from the root)
2. Check the browser console for any errors
3. Try clearing your browser cache
4. If changing the component, run the build again from the root

## How It Works

This example demonstrates:

1. Importing the SelectChat component in a React application
2. Handling API key input
3. Theme switching (light/dark)
4. Text selection and chat functionality

The key components are:

- `App.jsx`: The main React component
- `index.js`: The React entry point
- `styles.css`: Basic styling for the example 