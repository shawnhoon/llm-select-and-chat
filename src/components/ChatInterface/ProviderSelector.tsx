import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LLMProvider } from '../../types';

interface ProviderSelectorProps {
  currentProvider?: LLMProvider | null;
  onProviderChange: (provider: LLMProvider) => void;
  apiKeys: {
    openai?: string;
    gemini?: string;
    claude?: string;
  };
  onApiKeysChange: (keys: { openai?: string; gemini?: string; claude?: string }) => void;
}

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.medium};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SelectorTitle = styled.h4`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.medium};
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ProviderTabs = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ProviderTab = styled.button<{ isActive: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.isActive ? props.theme.colors.background : 'transparent'};
  color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text};
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.isActive ? '600' : '400'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.backgroundLight};
  }
`;

const ApiKeyInput = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InputLabel = styled.label`
  display: block;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.medium};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ModelSelect = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.medium};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ApplyButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textOnPrimary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.backgroundDisabled};
    color: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
    transform: none;
  }
`;



// Model options for each provider
const modelOptions = {
    openai: [
        { value: 'o4-mini', label: 'o4-mini' },
        { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano' },

    ],
    gemini: [
        { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
        { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    ],
    claude: [
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'claude-2.1', label: 'Claude 2.1' }
    ]
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ 
  currentProvider, 
  onProviderChange,
  apiKeys,
  onApiKeysChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initialize states from currentProvider
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini' | 'claude'>(
    (currentProvider?.type as 'openai' | 'gemini' | 'claude') || 'openai'
  );
  
  const [selectedModel, setSelectedModel] = useState<string>(
    currentProvider?.defaultParams.model || modelOptions[selectedProvider][0].value
  );
  
  const [temperature, setTemperature] = useState<number>(
    currentProvider?.defaultParams.temperature || 0.7
  );
  
  // Update local state when currentProvider changes
  useEffect(() => {
    if (currentProvider) {
      setSelectedProvider(currentProvider.type as 'openai' | 'gemini' | 'claude');
      setSelectedModel(currentProvider.defaultParams.model);
      setTemperature(currentProvider.defaultParams.temperature || 0.7);
    }
  }, [currentProvider]);
  
  // Update selected model when provider changes
  useEffect(() => {
    // Reset model to the first one in the list when provider changes
    setSelectedModel(modelOptions[selectedProvider][0].value);
  }, [selectedProvider]);
  
  const [localApiKeys, setLocalApiKeys] = useState({
    openai: apiKeys.openai || '',
    gemini: apiKeys.gemini || '',
    claude: apiKeys.claude || ''
  });
  
  const handleApiKeyChange = (provider: 'openai' | 'gemini' | 'claude', key: string) => {
    const updatedKeys = { ...localApiKeys, [provider]: key };
    setLocalApiKeys(updatedKeys);
    onApiKeysChange(updatedKeys);
  };
  
  const handleApply = () => {
    const newProvider: LLMProvider = {
      type: selectedProvider,
      apiKey: localApiKeys[selectedProvider] || '',
      defaultParams: {
        model: selectedModel,
        temperature,
        maxTokens: 128000
      }
    };
    
    // Enhanced console logging with styling
    console.log('%c🔄 MODEL SELECTION', 'background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 14px;');
    console.log('%cSelected Provider:', 'font-weight: bold;', selectedProvider);
    console.log('%cSelected Model:', 'font-weight: bold;', selectedModel);
    console.log('%cAvailable Models:', 'font-weight: bold;', modelOptions[selectedProvider].map(m => m.value).join(', '));
    console.log('%cTemperature:', 'font-weight: bold;', temperature);
    
    onProviderChange(newProvider);
    setIsExpanded(false); // Collapse after applying changes
  };
  
  if (!isExpanded) {
    // Helper function to get proper display name
    const getModelDisplay = () => {
      if (!currentProvider) return 'Default';
      return `${currentProvider.defaultParams.model} (${currentProvider.type})`;
    };
    
    return (
      <SelectorContainer>
        <SelectorHeader>
          <SelectorTitle>
            Model: {getModelDisplay()}
          </SelectorTitle>
          <ToggleButton onClick={() => setIsExpanded(true)}>Change Model</ToggleButton>
        </SelectorHeader>
      </SelectorContainer>
    );
  }
  
  const apiKeyIsValid = localApiKeys[selectedProvider]?.trim().length > 0;
  
  return (
    <SelectorContainer>
      <SelectorHeader>
        <SelectorTitle>Select Model</SelectorTitle>
        <ToggleButton onClick={() => setIsExpanded(false)}>Collapse</ToggleButton>
      </SelectorHeader>
      
      <ProviderTabs>
        <ProviderTab 
          isActive={selectedProvider === 'openai'} 
          onClick={() => {
            console.log('Switching to OpenAI provider');
            setSelectedProvider('openai');
            // Model will be updated automatically by the useEffect
          }}
        >
          OpenAI
        </ProviderTab>
        <ProviderTab 
          isActive={selectedProvider === 'gemini'} 
          onClick={() => {
            console.log('Switching to Gemini provider');
            setSelectedProvider('gemini');
            // Model will be updated automatically by the useEffect
          }}
        >
          Gemini
        </ProviderTab>
        <ProviderTab 
          isActive={selectedProvider === 'claude'} 
          onClick={() => {
            console.log('Switching to Claude provider');
            setSelectedProvider('claude');
            // Model will be updated automatically by the useEffect
          }}
        >
          Claude
        </ProviderTab>
      </ProviderTabs>
      
      <ApiKeyInput>
        <InputLabel htmlFor={`${selectedProvider}-api-key`}>API Key</InputLabel>
        <Input 
          id={`${selectedProvider}-api-key`}
          type="password"
          placeholder={`Enter your ${selectedProvider} API key`}
          value={localApiKeys[selectedProvider]}
          onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
        />
      </ApiKeyInput>
      
      <ApiKeyInput>
        <InputLabel htmlFor="model-select">Model</InputLabel>
        <ModelSelect 
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {modelOptions[selectedProvider].map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ModelSelect>
      </ApiKeyInput>
      
      <ApiKeyInput>
        <InputLabel htmlFor="temperature-select">
          Temperature: {temperature} {' '}
          <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
            (Lower = more focused, Higher = more creative)
          </span>
        </InputLabel>
        <Input 
          id="temperature-select"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
      </ApiKeyInput>
      
      <ApplyButton 
        onClick={handleApply} 
        disabled={!apiKeyIsValid}
      >
        Apply Changes
      </ApplyButton>
    </SelectorContainer>
  );
}; 