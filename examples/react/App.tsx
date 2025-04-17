import React, { useState } from 'react';
import { SelectChat } from '../../src';
import './App.css';

type ThemeMode = 'light' | 'dark' | 'auto';

const App: React.FC = () => {
  // State for theme mode
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  
  // Toggle theme
  const toggleTheme = () => {
    setThemeMode(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SelectChat React Example</h1>
        <div className="controls">
          <button onClick={toggleTheme}>
            Toggle Theme ({themeMode})
          </button>
        </div>
      </header>

      <main>
        <div className="content-section">
          <h2>Sample Content (Try Selecting Text)</h2>
          <div className="sample-content">
            <p>
              This is a demonstration of the SelectChat component integrated into a React application.
              It allows users to select text and instantly chat with an AI assistant about the 
              selected content.
            </p>
            
            <p>
              The component can be integrated into any React application. It's designed to be flexible,
              themeable, and easy to use. You can select this text to see it in action.
            </p>
            
            <div className="code-block">
              <h3>Example Code:</h3>
              <pre>
                {`import { SelectChat } from 'select-chat';

function MyComponent() {
  return (
    <SelectChat 
      apiKey="YOUR_API_KEY"
      theme="light"
      onMessageSent={(message) => console.log('Message sent:', message)}
    />
  );
}`}
              </pre>
            </div>
            
            <p>
              Here are some example use cases:
            </p>
            <ul>
              <li>Educational websites: Students can ask questions about specific passages.</li>
              <li>Documentation: Developers can inquire about code snippets or technical explanations.</li>
              <li>News sites: Readers can ask for additional context on specific statements.</li>
              <li>Research platforms: Researchers can request summaries or analyses of selected data.</li>
            </ul>
            
            <p>
              Try selecting any text on this page and see how the chat component appears, allowing you to
              ask questions about the selected content.
            </p>
          </div>
        </div>

        <div className="chat-container">
          <h2>SelectChat Component</h2>
          <SelectChat
            apiKey="YOUR_OPENAI_API_KEY" // Replace with your actual API key
            theme={themeMode}
            defaultPreferences={{
              theme: themeMode,
              selectedProvider: 'openai',
              position: 'float'
            }}
            onMessageSent={(message) => console.log('Message sent:', message)}
            onMessageReceived={(message) => console.log('Response received:', message)}
            onTextSelected={(selection) => console.log('Text selected:', selection)}
          />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>SelectChat Example - <a href="https://github.com/your-username/select-chat" target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </div>
  );
};

export default App; 