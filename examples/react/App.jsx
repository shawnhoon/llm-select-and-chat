import React, { useState } from 'react';
import { SelectChat, createTheme, ThemeProvider } from '../../dist/index.esm.js';

const themes = {
  light: createTheme('light'),
  dark: createTheme('dark'),
  custom: (() => {
    const theme = createTheme('light');
    theme.colors.primary = '#8A2BE2'; // BlueViolet
    theme.colors.background = '#f8f9fa';
    theme.colors.border = '#dee2e6';
    return theme;
  })()
};

function App() {
  const [apiKey, setApiKey] = useState('');
  const [activeTheme, setActiveTheme] = useState('light');
  const [initialized, setInitialized] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  
  const handleInit = () => {
    if (!apiKey.trim()) {
      alert('Please enter your API key');
      return;
    }
    setInitialized(true);
  };
  
  const handleSelectionCapture = (selection) => {
    console.log('Selection captured:', selection);
  };
  
  const handleConversationUpdate = (conversation) => {
    console.log('Conversation updated:', conversation);
    
    // Check for attachments in the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.attachments?.length > 0) {
      console.log('Image attachments:', lastMessage.attachments);
    }
  };
  
  const handleError = (error) => {
    console.error('Error occurred:', error);
  };
  
  return (
    <div className="app-container">
      <header>
        <h1>LLM Select and Chat - React Example</h1>
      </header>
      
      <main>
        <div className="content">
          <h2>Configuration</h2>
          
          {!initialized ? (
            <div className="config-panel">
              <div className="form-group">
                <label htmlFor="api-key">API Key:</label>
                <input
                  type="text"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API Key"
                />
              </div>
              
              <div className="form-group">
                <label>Theme:</label>
                <div className="theme-buttons">
                  <button
                    className={activeTheme === 'light' ? 'active' : ''}
                    onClick={() => setActiveTheme('light')}
                  >
                    Light
                  </button>
                  <button
                    className={activeTheme === 'dark' ? 'active' : ''}
                    onClick={() => setActiveTheme('dark')}
                  >
                    Dark
                  </button>
                  <button
                    className={activeTheme === 'custom' ? 'active' : ''}
                    onClick={() => setActiveTheme('custom')}
                  >
                    Custom
                  </button>
                </div>
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="show-timestamps"
                  checked={showTimestamps}
                  onChange={(e) => setShowTimestamps(e.target.checked)}
                />
                <label htmlFor="show-timestamps">Show Timestamps</label>
              </div>
              
              <button className="init-button" onClick={handleInit}>
                Initialize Chat Interface
              </button>
            </div>
          ) : (
            <div className="docs">
              <h3>Usage Instructions</h3>
              <ol>
                <li>Select any text on this page</li>
                <li>Use the chat interface to discuss the selected text</li>
                <li>Try pasting an image from your clipboard (screenshot)</li>
                <li>Open browser console to see events logged</li>
              </ol>
              
              <h3>Sample Text (Select Me)</h3>
              <p>
                This is an example paragraph that you can select to test the selection 
                functionality. Simply highlight any portion of this text, and it will 
                be captured by the selection hook. The selection will include context 
                before and after the selected text.
              </p>
              <p>
                You can also select across multiple paragraphs to see how the component
                handles larger selections. The context will be captured from both the 
                beginning and end of your selection, giving the AI assistant more 
                information to work with when responding to your queries.
              </p>
            </div>
          )}
        </div>
        
        {initialized && (
          <ThemeProvider theme={themes[activeTheme]}>
            <div className="chat-container">
              <SelectChat
                apiKey={apiKey}
                userPreferences={{
                  showTimestamps: showTimestamps,
                  codeHighlighting: true,
                  fontSize: 'medium'
                }}
                onSelectionCapture={handleSelectionCapture}
                onConversationUpdate={handleConversationUpdate}
                onError={handleError}
              />
            </div>
          </ThemeProvider>
        )}
      </main>
    </div>
  );
}

export default App; 