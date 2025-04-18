import React, { useState, useEffect } from 'react';
// Import from the root package, including the theme utility
import { SelectChat, createTheme } from '../../src';
import './styles.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [themeChoice, setThemeChoice] = useState('light');
  const [promptChoice, setPromptChoice] = useState('standard');
  const [searchEnabled, setSearchEnabled] = useState(false);
  
  // System prompt templates
  const systemPrompts = {
    standard: {
      template: `1. **Primary Focus:** 
   - Start with the specifically selected text and user's current question
\${useSearch ? \`
   - ALWAYS search when questions ask about:
     * Reviews, ratings, or public reception
     * Author background or other works
     * Sales data or popularity
     * Critical analysis or comparisons
     * Reader feedback or recommendations
   - If the selected text contains outdated or unclear information, use search to verify or update it
   - Always indicate when you're using search to verify selected text
\` : ''}

2. **Immediate Context:** 
   - Use the text immediately before and after the selection to clarify meaning
\${useSearch ? \`
   - If context references external events or facts, use search to provide current information
   - Blend contextual understanding with verified facts
\` : ''}

3. **Local Context:** 
   - Rely on the current chapter for additional detail
\${useSearch ? \`
   - If chapter contains historical or technical information, verify accuracy through search
   - Maintain balance between document content and external verification
\` : ''}

4. **Broader Context:** 
   - Reference full document content only when immediate and local context are insufficient
\${useSearch ? \`
   - Use search to supplement document information when needed
   - Clearly distinguish between document content and external sources
\` : ''}

5. **Conversational Context:** 
   - Build on previous conversation history to enhance understanding
\${useSearch ? \`
   - Use search to follow up on previously discussed topics with current information
   - Maintain consistency between past responses and new search results
\` : ''}

\${useSearch ? \`
6. **External Verification:** 
   - ALWAYS search when encountering:
     * Reviews, ratings, and reader feedback
     * Dates, statistics, or numerical claims
     * Technical specifications or standards
     * Current events or recent developments
     * Scientific or medical information
     * Legal or regulatory information
     * Author information or related works
     * Publication history or editions
     * Cultural impact or reception
   - Verify document claims that seem outdated or uncertain
   - Cross-reference document information with current sources
   - Blend search results naturally with document context

When using search results:
1. ALWAYS cite your sources using [1], [2], etc. at the end of statements from search
2. ALWAYS provide specific quotes or information from each source you reference
3. Format citations like this: "According to [1], the book received critical acclaim"
4. Use multiple sources when available to provide comprehensive information
5. Maintain focus on the user's question while incorporating external information

Example format:
"The book received widespread acclaim for its innovative approach [1]. Critics particularly praised its narrative structure [2], and it went on to win several awards [1][3]."

IMPORTANT: 
- EVERY fact from search must have a citation number
- ALL search information requires proper source attribution
- Include specific quotes or data points from your sources
- Cross-reference multiple sources when possible
- Balance document content with verified external information

Always ground your initial response in the document content, then enhance with search when needed for accuracy or currency.
\` : 'Focus on analyzing and explaining the document content based on the available context.'}`,
      useSearch: false,
      contextLevels: {
        primary: true,
        immediate: true,
        local: true,
        broader: true,
        conversational: true,
        external: false
      }
    },
    concise: {
      template: `
You are analyzing selected text with surrounding context.
1. Focus primarily on the selected text and user's question.
2. Use context before/after selection to clarify meaning.
3. Refer to broader document context when necessary.
4. Keep responses concise and directly address the user's question.
5. Maintain a helpful, informative tone.
\${useSearch ? 'Use search results to verify factual information, citing sources with [1], [2], etc.' : 'Stick to analyzing the provided text content only.'}
`,
      useSearch: false,
      contextLevels: {
        primary: true,
        immediate: true,
        local: true,
        broader: false,
        conversational: false,
        external: false
      }
    },
    code: {
      template: `
You are analyzing selected code with surrounding context.

1. **Primary Focus:** 
   - Focus on the specifically selected code and the user's question
   - Explain the purpose, functionality, and implementation details of the selected code

2. **Code Structure:**
   - Identify key patterns, design principles, and architectural elements
   - Explain how the selected code fits into the broader codebase

3. **Technical Analysis:**
   - Identify potential bugs, performance issues, or security concerns
   - Suggest improvements or optimizations when appropriate

4. **Language-Specific Context:**
   - Provide language-specific best practices and idioms
   - Explain language features being used in the code

Keep explanations technical but clear, and focus on helping the user understand both functionality and implementation details.
`,
      useSearch: false,
      contextLevels: {
        primary: true,
        immediate: true,
        local: true,
        broader: false,
        conversational: true,
        external: false
      }
    }
  };
  
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

  const handlePromptChange = (e) => {
    setPromptChoice(e.target.value);
  };

  const handleSearchToggle = (e) => {
    setSearchEnabled(e.target.checked);
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

  // Get current system prompt configuration
  const getCurrentSystemPrompt = () => {
    const promptTemplate = systemPrompts[promptChoice];
    if (!promptTemplate) return systemPrompts.standard;
    
    return {
      ...promptTemplate,
      useSearch: searchEnabled
    };
  };

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
            
            <div className="prompt-section">
              <div className="form-group">
                <label htmlFor="prompt">System Prompt Template</label>
                <select
                  id="prompt"
                  className="prompt-select"
                  value={promptChoice}
                  onChange={handlePromptChange}
                >
                  <option value="standard">Standard</option>
                  <option value="concise">Concise</option>
                  <option value="code">Code Analysis</option>
                </select>
                <div className="prompt-option">
                  <input
                    type="checkbox"
                    id="searchEnabled"
                    checked={searchEnabled}
                    onChange={handleSearchToggle}
                  />
                  <label htmlFor="searchEnabled">Enable Search for External Verification</label>
                </div>
                <div className="prompt-preview">
                  <small>Selected template: {promptChoice}</small>
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
              <li>Configurable system prompts to guide AI responses</li>
              <li>Option to enable/disable web search for fact verification</li>
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
              systemPromptConfig={getCurrentSystemPrompt()}
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