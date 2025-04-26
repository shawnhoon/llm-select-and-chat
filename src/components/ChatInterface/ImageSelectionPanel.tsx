import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelectionCaptureContext } from '../SelectionCapture';
import { Attachment } from '../../types';

interface ImageSelectionPanelProps {
  visible: boolean;
  onClose: () => void;
}

const Panel = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: ${props => props.theme.spacing.md};
  max-height: 300px;
  overflow-y: auto;
  display: ${props => props.visible ? 'block' : 'none'};
  z-index: 10;
  margin-bottom: 8px;
  transition: opacity 0.2s ease;
  opacity: ${props => props.visible ? 1 : 0};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizes.medium};
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.medium};
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
  }
`;

const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const ImageItem = styled.div<{ isSelected: boolean }>`
  position: relative;
  border-radius: ${props => props.theme.borderRadius.small};
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? props.theme.colors.primary : 'transparent'};
  transition: all 0.2s ease;
  aspect-ratio: 1;
  
  &:hover {
    border-color: ${props => props.isSelected ? props.theme.colors.primary : props.theme.colors.primaryLight};
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SelectionIndicator = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const AddImageButton = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px dashed ${props => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  aspect-ratio: 1;
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const AddImageIcon = styled.div`
  font-size: 24px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const AddImageText = styled.div`
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
`;

const InfoText = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.small};
  text-align: center;
`;

const FileInput = styled.input`
  display: none;
`;

export const ImageSelectionPanel: React.FC<ImageSelectionPanelProps> = ({ visible, onClose }) => {
  const { selectedImages, toggleImageSelection } = useSelectionCaptureContext();
  const [images, setImages] = useState<Attachment[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Merge any images in context with local images
  useEffect(() => {
    setImages(prev => {
      // Combine existing images with selected images from context
      const existingUrls = prev.map(img => img.url);
      const newImages = selectedImages.filter(img => !existingUrls.includes(img.url));
      return [...prev, ...newImages];
    });
  }, [selectedImages]);
  
  const handleImageClick = (image: Attachment) => {
    // Create a temporary image element to pass to toggleImageSelection
    const tempImg = document.createElement('img');
    tempImg.src = image.url || '';
    tempImg.alt = image.name;
    
    toggleImageSelection(tempImg);
  };
  
  const handleAddImage = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      const newImage: Attachment = {
        id,
        type: 'image',
        name: file.name,
        url,
        data: file,
        mimeType: file.type
      };
      
      setImages(prev => [...prev, newImage]);
      
      // Create a temporary image element to pass to toggleImageSelection
      const tempImg = document.createElement('img');
      tempImg.src = url;
      tempImg.alt = file.name;
      
      toggleImageSelection(tempImg);
    }
    
    // Reset the file input
    e.target.value = '';
  };
  
  const isImageSelected = (image: Attachment) => {
    return selectedImages.some(img => img.url === image.url);
  };
  
  return (
    <Panel visible={visible}>
      <PanelHeader>
        <PanelTitle>Select Images</PanelTitle>
        <CloseButton onClick={onClose} title="Close panel">✕</CloseButton>
      </PanelHeader>
      
      <ImagesGrid>
        {images.map(image => (
          <ImageItem 
            key={image.id} 
            isSelected={isImageSelected(image)}
            onClick={() => handleImageClick(image)}
          >
            <StyledImage src={image.url || ''} alt={image.name} />
            {isImageSelected(image) && <SelectionIndicator>✓</SelectionIndicator>}
          </ImageItem>
        ))}
        
        <AddImageButton onClick={handleAddImage}>
          <AddImageIcon>+</AddImageIcon>
          <AddImageText>Add</AddImageText>
        </AddImageButton>
      </ImagesGrid>
      
      {images.length === 0 && (
        <InfoText>Add images to include in your selection context</InfoText>
      )}
      
      <FileInput 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        multiple 
        onChange={handleFileChange}
      />
    </Panel>
  );
}; 