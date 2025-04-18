import React, { useState, useEffect } from 'react';
// Import from the root package, including the theme utility
import { SelectChat, createTheme } from '../../src';
import './styles.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [themeChoice, setThemeChoice] = useState('light');
  
  // Define custom color sets for our themes
  const themeColors = {
    blue: {
      primary: '#0066cc',
      primaryDark: '#0055aa',
      primaryLight: '#4d94ff',
      background: '#f0f8ff',
      backgroundLight: '#e6f2ff',
      surface: '#e6f2ff',
      text: '#333333',
      border: '#cce5ff',
      userMessage: '#d1e6ff',
      assistantMessage: '#e6f2ff'
    },
    green: {
      primary: '#1e8e3e',
      primaryDark: '#167032',
      primaryLight: '#4cb06a',
      background: '#f2f9f2',
      backgroundLight: '#e6f4e6',
      surface: '#e6f4e6',
      text: '#333333',
      border: '#ceebce',
      userMessage: '#d5ecd5',
      assistantMessage: '#e6f4e6'
    }
  };
  
  // Generate a theme using the library's built-in utility
  const getThemeObject = (themeName) => {
    switch (themeName) {
      case 'dark':
        return createTheme('dark');
      case 'blue':
        return createTheme('light', themeColors.blue);
      case 'green':
        return createTheme('light', themeColors.green);
      case 'light':
      default:
        return createTheme('light');
    }
  };
  
  // Load API key from localStorage if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem('chat_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when changed
  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('chat_api_key', newKey);
  };

  const handleThemeChange = (e) => {
    setThemeChoice(e.target.value);
  };

  // Apply body class based on theme
  useEffect(() => {
    document.body.className = themeChoice === 'dark' ? 'dark-theme' : 'light-theme';
  }, [themeChoice]);

  // Create a provider configuration object
  const providerConfig = {
    type: 'openai',
    apiKey: apiKey,
    defaultParams: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000
    }
  };

  // Get the current theme object for UI preview
  const currentTheme = getThemeObject(themeChoice);

  // Determine base theme and custom colors for SelectChat
  const getSelectChatThemeProps = () => {
    // For blue and green, use light theme as base with custom colors
    if (themeChoice === 'blue' || themeChoice === 'green') {
      return {
        theme: 'light',
        customTheme: { colors: themeColors[themeChoice] }
      };
    }
    
    // For light and dark, just pass the theme name
    return { 
      theme: themeChoice,
      customTheme: undefined
    };
  };

  const selectChatThemeProps = getSelectChatThemeProps();

  return (
    <div className={`app-container ${themeChoice}-theme`}>
      <header className="app-header">
        <h1>SelectChat React Example</h1>
      </header>
      
      <div className="main-content">
        <div className="content-area">
          <div className="config-panel">
            <div className="api-section">
              <div className="form-group">
                <label htmlFor="apiKey">OpenAI API Key</label>
                <input
                  type="password"
                  id="apiKey"
                  className="api-input"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your OpenAI API key"
                />
                <div className="api-hint">
                  Your API key is stored locally in your browser
                </div>
              </div>
            </div>
            
            <div className="theme-section">
              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  className="theme-select"
                  value={themeChoice}
                  onChange={handleThemeChange}
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="blue">Blue Theme</option>
                  <option value="green">Green Theme</option>
                </select>
                <div 
                  className="theme-preview"
                  style={{ 
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    border: `1px solid ${currentTheme.colors.border}`,
                    padding: '8px',
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}
                >
                  Theme Preview
                </div>
              </div>
            </div>
          </div>
          
          <div className="demo-content">
            <h3>SelectChat Demo</h3>
            <p>
              Select any text in this box to see the chat interface appear!
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies ultricies, 
              nunc nisl ultricies nunc, eget ultricies nisl nisl eget ultricies. Nullam euismod, nisl eget ultricies ultricies,
              nunc nisl ultricies nunc, eget ultricies nisl nisl eget ultricies.
            </p>
            <p style={{ 
              backgroundColor: currentTheme.colors.userMessage, 
              padding: '8px', 
              borderRadius: '4px', 
              border: `1px solid ${currentTheme.colors.border}`
            }}>
              Try selecting this paragraph to ask questions about the text. The SelectChat component will 
              automatically appear with the selected text as context.
            </p>
            <p>
              You can also try different themes using the dropdown above to see how the chat interface adapts.
            </p>
          </div>
          
          <div className="feature-description">
            <h3>Features</h3>
            <ul>
              <li>Text selection triggers chat interface</li>
              <li>Customizable themes (light, dark, blue, green)</li>
              <li>API key storage in localStorage</li>
              <li>Responsive design for all screen sizes</li>
            </ul>
          </div>
        </div>
        
        <div className="side-chat-panel">
          <div className="llm-chat-wrapper">
            <SelectChat
              container={false}
              apiKey={apiKey}
              provider={providerConfig}
              theme={selectChatThemeProps.theme}
              customTheme={selectChatThemeProps.customTheme}
              userPreferences={{
                saveApiKey: true,
                autoEnableMic: false
              }}
            />
          </div>
        </div>
      </div>
      
      <footer className="app-footer">
        <p>
          SelectChat Demo | <a href="https://github.com/yourusername/llm-select-and-chat" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App; 