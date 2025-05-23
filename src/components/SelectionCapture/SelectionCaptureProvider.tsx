import React, { createContext, ReactNode, useContext } from 'react';
import { Selection, Attachment } from '../../types';
import { useSelectionCapture } from './useSelectionCapture';

interface SelectionCaptureContextType {
  selection: Selection | null;
  captureSelection: () => void;
  clearSelection: () => void;
  toggleImageSelection: (imageElement: HTMLImageElement) => void;
  selectedImages: Attachment[];
}

// Export the context so it can be used by other components
export const SelectionCaptureContext = createContext<SelectionCaptureContextType | undefined>(undefined);

export const useSelectionCaptureContext = (): SelectionCaptureContextType => {
  const context = useContext(SelectionCaptureContext);
  if (context === undefined) {
    throw new Error('useSelectionCaptureContext must be used within a SelectionCaptureProvider');
  }
  return context;
};

interface SelectionCaptureProviderProps {
  children: ReactNode;
  autoCapture?: boolean;
  onTextSelected?: (selection: Selection) => void;
  extractFullDocument?: boolean;
}

export const SelectionCaptureProvider: React.FC<SelectionCaptureProviderProps> = ({
  children,
  autoCapture = true,
  onTextSelected,
  extractFullDocument = false,
}) => {
  const { 
    selection, 
    captureSelection, 
    clearSelection,
    toggleImageSelection,
    selectedImages
  } = useSelectionCapture({
    autoCapture,
    onTextSelected,
    extractFullDocument,
  });

  // Create the context value object once to avoid unnecessary re-renders
  const contextValue: SelectionCaptureContextType = {
    selection,
    captureSelection,
    clearSelection,
    toggleImageSelection,
    selectedImages,
  };

  return (
    <SelectionCaptureContext.Provider value={contextValue}>
      {children}
    </SelectionCaptureContext.Provider>
  );
}; 