import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelectionCaptureContext, SelectionCaptureContext } from './SelectionCaptureProvider';
import { Attachment } from '../../types';

interface SelectableImageProps {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const ImageContainer = styled.div<{ isSelected: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? props.theme.colors.primary : 'transparent'};
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.isSelected ? props.theme.colors.primary : props.theme.colors.primaryLight};
  }
`;

const StyledImage = styled.img`
  display: block;
  max-width: 100%;
`;

const SelectionIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const SelectableImage: React.FC<SelectableImageProps> = ({
  src,
  alt = 'Selectable image',
  width,
  height,
  className,
  style
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const { toggleImageSelection, selectedImages } = useSelectionCaptureContext();
  const imageRef = React.useRef<HTMLImageElement>(null);
  
  // Check if this image is in the selected images list
  useEffect(() => {
    const isImageSelected = selectedImages.some((img: Attachment) => img.url === src);
    setIsSelected(isImageSelected);
  }, [selectedImages, src]);
  
  const handleClick = () => {
    if (imageRef.current) {
      // Toggle the selection state
      toggleImageSelection(imageRef.current);
    }
  };
  
  return (
    <ImageContainer isSelected={isSelected} onClick={handleClick} className={className} style={style}>
      <StyledImage 
        ref={imageRef}
        src={src} 
        alt={alt}
        width={width} 
        height={height}
      />
      {isSelected && (
        <SelectionIndicator>✓</SelectionIndicator>
      )}
    </ImageContainer>
  );
}; 