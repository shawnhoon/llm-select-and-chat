import React, { createContext, ReactNode, useContext } from 'react';
import { Selection } from '../../types';
import { useSelectionCapture } from './useSelectionCapture';

interface SelectionCaptureContextType {
  selection: Selection | null;
  captureSelection: () => void;
  clearSelection: () => void;
}

const SelectionCaptureContext = createContext<SelectionCaptureContextType | undefined>(undefined);

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
}

export const SelectionCaptureProvider: React.FC<SelectionCaptureProviderProps> = ({
  children,
  autoCapture = true,
  onTextSelected,
}) => {
  const { selection, captureSelection, clearSelection } = useSelectionCapture({
    autoCapture,
    onTextSelected,
  });

  return (
    <SelectionCaptureContext.Provider
      value={{
        selection,
        captureSelection,
        clearSelection,
      }}
    >
      {children}
    </SelectionCaptureContext.Provider>
  );
}; 