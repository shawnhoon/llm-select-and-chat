import React, { useState, KeyboardEvent, useRef, useContext, ClipboardEvent } from 'react';
import styled from 'styled-components';
import { SelectionCaptureContext } from '../SelectionCapture';
import { Attachment } from '../../types';

interface MessageInputProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isSelectionActive?: boolean;
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

const AttachButton = styled.button<{ isActive: boolean }>`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  width: 40px;
  height: 40px;
  margin-right: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AttachIcon = styled.svg`
  width: 22px;
  height: 22px;
`;

const FileInput = styled.input`
  display: none;
`;

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  isSelectionActive = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const selectionContext = useContext(SelectionCaptureContext);
  
  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    handleFiles(files);
    
    // Reset the file input
    e.target.value = '';
  };
  
  const handleFiles = (files: FileList) => {
    if (isSelectionActive && selectionContext) {
      // If there's an active selection, add images to it
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        // Create a temporary image to add to the selection
        const tempImg = document.createElement('img');
        tempImg.src = URL.createObjectURL(file);
        tempImg.alt = file.name;
        
        selectionContext.toggleImageSelection(tempImg);
      }
    } else {
      // Otherwise, add them to message attachments
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const url = URL.createObjectURL(file);
        
        const newAttachment: Attachment = {
          id,
          type: 'image',
          name: file.name,
          url,
          data: file,
          mimeType: file.type
        };
        
        setAttachments(prev => [...prev, newAttachment]);
        
        // Show a brief visual feedback that image was added
        if (textInputRef?.current) {
          const originalBorder = textInputRef.current.style.border;
          textInputRef.current.style.border = '2px solid #4ade80'; // success color
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.style.border = originalBorder;
            }
          }, 500);
        }
      }
    }
  };
  
  // Handle paste event for images
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let hasHandledImage = false;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle image files from clipboard
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (!blob) continue;
        
        // If there's an active selection and selection context, add to selection
        if (isSelectionActive && selectionContext) {
          // Create a temporary image to add to the selection
          const tempImg = document.createElement('img');
          tempImg.src = URL.createObjectURL(blob);
          tempImg.alt = `Pasted Image ${new Date().toLocaleTimeString()}`;
          
          selectionContext.toggleImageSelection(tempImg);
        } else {
          // Otherwise add to message attachments
          const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const imageUrl = URL.createObjectURL(blob);
          
          const newAttachment: Attachment = {
            id,
            type: 'image',
            name: `Pasted Image ${new Date().toLocaleTimeString()}`,
            data: blob,
            url: imageUrl,
            mimeType: blob.type
          };
          
          setAttachments(prev => [...prev, newAttachment]);
        }
        
        hasHandledImage = true;
      }
    }
    
    // Only prevent default if we handled an image
    if (hasHandledImage) {
      e.preventDefault();
      
      // Show a brief visual feedback that image was added
      if (textInputRef?.current) {
        const originalBorder = textInputRef.current.style.border;
        textInputRef.current.style.border = '2px solid #4ade80'; // success color
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.style.border = originalBorder;
          }
        }, 500);
      }
    }
  };
  
  // Remove an attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const newAttachments = prev.filter(attachment => attachment.id !== id);
      
      // Revoke the URL to free memory
      const removedAttachment = prev.find(attachment => attachment.id === id);
      if (removedAttachment?.url) {
        URL.revokeObjectURL(removedAttachment.url);
      }
      
      return newAttachments;
    });
  };
  
  return (
    <InputContainer>
      {isSelectionActive && selectionContext && (
        <>
          <AttachButton 
            onClick={handleAttachClick} 
            disabled={disabled}
            isActive={!disabled}
            title="Attach image to selection"
          >
            <AttachIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
            </AttachIcon>
          </AttachButton>
          
          <FileInput 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange}
          />
        </>
      )}
      
      {attachments.length > 0 && (
        <div style={{ 
          display: 'flex', 
          position: 'absolute', 
          top: '-60px', 
          left: '0', 
          right: '0',
          background: 'white',
          padding: '8px',
          gap: '8px',
          borderTop: '1px solid #eee',
          zIndex: 1
        }}>
          {attachments.map(attachment => (
            <div key={attachment.id} style={{ 
              position: 'relative', 
              width: '50px', 
              height: '50px', 
              overflow: 'hidden',
              borderRadius: '4px' 
            }}>
              <img 
                src={attachment.url} 
                alt={attachment.name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
              <button 
                onClick={() => handleRemoveAttachment(attachment.id)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <TextInput
        ref={textInputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={attachments.length > 0 ? "Add a caption to your image(s) or press Send..." : "Type your message or paste an image..."}
        disabled={disabled}
        rows={1}
      />
      <SendButton 
        onClick={handleSend} 
        disabled={disabled || (!message.trim() && attachments.length === 0)}
        isActive={!!(message.trim() || attachments.length > 0) && !disabled}
      >
        <SendIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </SendIcon>
      </SendButton>
    </InputContainer>
  );
}; 