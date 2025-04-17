import React, { useState, KeyboardEvent } from 'react';
import styled from 'styled-components';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const InputContainer = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const TextInput = styled.textarea`
  flex-grow: 1;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.small};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.backgroundDisabled};
    cursor: not-allowed;
  }
`;

const SendButton = styled.button<{ isActive: boolean }>`
  background-color: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : theme.colors.backgroundLight};
  color: ${({ isActive, theme }) => 
    isActive ? theme.colors.textOnPrimary : theme.colors.textLight};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  width: 40px;
  height: 40px;
  margin-left: ${({ theme }) => theme.spacing.sm};
  cursor: ${({ isActive }) => isActive ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ isActive, theme }) => 
      isActive ? theme.colors.primaryDark : theme.colors.backgroundLight};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.backgroundDisabled};
    cursor: not-allowed;
  }
`;

const SendIcon = styled.svg`
  width: 20px;
  height: 20px;
`;

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <InputContainer>
      <TextInput
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <SendButton 
        onClick={handleSend} 
        disabled={disabled || !message.trim()}
        isActive={!!message.trim() && !disabled}
      >
        <SendIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </SendIcon>
      </SendButton>
    </InputContainer>
  );
}; 