import { useCallback, useEffect, useState } from 'react';
import { Selection } from '../../types';

interface UseSelectionCaptureProps {
  autoCapture: boolean;
  onTextSelected?: (selection: Selection) => void;
  onSelectionCleared?: () => void;
  extractFullDocument?: boolean;
}

export const useSelectionCapture = ({ 
  autoCapture, 
  onTextSelected,
  onSelectionCleared,
  extractFullDocument = false
}: UseSelectionCaptureProps) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [lastMouseUpTarget, setLastMouseUpTarget] = useState<EventTarget | null>(null);
  const [shortcutTriggered, setShortcutTriggered] = useState<boolean>(false);

  // Get the full document text
  const getDocumentText = useCallback((): string => {
    const bodyText = document.body.innerText || document.body.textContent || '';
    return bodyText;
  }, []);

  // Get context using direct document text
  const getDocumentContext = useCallback((selectedText: string): { contextBefore: string, contextAfter: string } => {
    const fullText = getDocumentText();
    const textIndex = fullText.indexOf(selectedText);
    
    if (textIndex === -1) return { contextBefore: '', contextAfter: '' };
    
    // Get as much context as possible
    const contextBefore = fullText.substring(0, textIndex);
    const contextAfter = fullText.substring(textIndex + selectedText.length);
    
    return { contextBefore, contextAfter };
  }, [getDocumentText]);

  // Add visual highlight when selection is made by keyboard shortcut
  const highlightTextSelection = () => {
    if (shortcutTriggered) {
      const selectionObj = window.getSelection();
      if (!selectionObj) return;
      
      const range = selectionObj.getRangeAt(0);
      if (!range) return;
      
      // For a brief moment, apply a highlight effect to indicate the keyboard shortcut worked
      const selectionContents = range.extractContents();
      const span = document.createElement('span');
      span.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'; // Light blue highlight
      span.style.transition = 'background-color 0.5s ease';
      span.append(selectionContents);
      range.insertNode(span);
      
      // Remove the highlight effect after a short delay
      setTimeout(() => {
        // Only if the span still exists in the DOM
        if (span.parentNode) {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      }, 600);
      
      // Reset the shortcut trigger state
      setShortcutTriggered(false);
    }
  };

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.isCollapsed) {
      return;
    }

    const selectedText = selectionObj.toString().trim();
    if (!selectedText) return;

    console.log('Text selected:', selectedText);

    // Default to using the document-level context approach for longer selections
    // This is the most reliable way to get context for longer/complex selections
    let contextBefore = '';
    let contextAfter = '';
    let contextSource = 'unknown';

    if (selectedText.length > 100) {
      // For longer selections, use the document context approach directly
      // This ensures we always have some context for long selections
      const documentContext = getDocumentContext(selectedText);
      contextBefore = documentContext.contextBefore;
      contextAfter = documentContext.contextAfter;
      contextSource = 'document-level';
    } else {
      try {
        // Try to use Range and element-based approaches for shorter selections
        const range = selectionObj.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const containerElement = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : (container as HTMLElement);
          
        if (containerElement) {
          // First try to get context from the direct container
          const fullText = containerElement.innerText || containerElement.textContent || '';
          const textIndex = fullText.indexOf(selectedText);
          
          if (textIndex !== -1) {
            contextBefore = fullText.substring(0, textIndex);
            contextAfter = fullText.substring(textIndex + selectedText.length);
            contextSource = 'container-element';
          } else {
            // If that fails, try parent elements up to 3 levels
            let parent = containerElement.parentElement;
            let level = 0;
            
            while (parent && level < 3 && (!contextBefore || !contextAfter)) {
              const parentText = parent.innerText || parent.textContent || '';
              const parentTextIndex = parentText.indexOf(selectedText);
              
              if (parentTextIndex !== -1) {
                contextBefore = parentText.substring(0, parentTextIndex);
                contextAfter = parentText.substring(parentTextIndex + selectedText.length);
                contextSource = `parent-level-${level+1}`;
                break;
              }
              
              parent = parent.parentElement;
              level++;
            }
            
            // If we still don't have context, fall back to document approach
            if (!contextBefore && !contextAfter) {
              const documentContext = getDocumentContext(selectedText);
              contextBefore = documentContext.contextBefore;
              contextAfter = documentContext.contextAfter;
              contextSource = 'document-fallback';
            }
          }
        } else {
          // Fallback to document approach if no container element
          const documentContext = getDocumentContext(selectedText);
          contextBefore = documentContext.contextBefore;
          contextAfter = documentContext.contextAfter;
          contextSource = 'no-container-fallback';
        }
      } catch (error) {
        console.error('Error capturing selection context:', error);
        
        // Last resort: use document-level context
        const documentContext = getDocumentContext(selectedText);
        contextBefore = documentContext.contextBefore;
        contextAfter = documentContext.contextAfter;
        contextSource = 'error-fallback';
      }
    }

    console.log('Selection context source:', contextSource);
    console.log('Selection context stats:', { 
      contextBeforeLength: contextBefore?.length || 0, 
      contextAfterLength: contextAfter?.length || 0 
    });

    // Create selection object with the best context we could find
    const newSelection: Selection = {
      text: selectedText,
      contextBefore,
      contextAfter,
      url: window.location.href,
      ...(extractFullDocument && { fullDocument: getDocumentText() })
    };

    // Log whether we're extracting full document or not
    console.log('Full document extraction:', extractFullDocument ? 'enabled' : 'disabled', 
      extractFullDocument ? `(${newSelection.fullDocument?.length || 0} chars)` : '');

    // Set the selection and call the callback if provided
    setSelection(newSelection);
    
    // Apply visual highlight effect if triggered by keyboard shortcut
    highlightTextSelection();
    
    if (onTextSelected) {
      console.log('Calling onTextSelected callback');
      onTextSelected(newSelection);
    }
  }, [onTextSelected, shortcutTriggered, getDocumentContext, getDocumentText, extractFullDocument]);

  // Set up event listeners
  useEffect(() => {
    if (!autoCapture) return;

    const handleMouseUp = (e: MouseEvent) => {
      setLastMouseUpTarget(e.target);
      // Small delay to allow the selection to be fully processed
      setTimeout(handleTextSelection, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [autoCapture, handleTextSelection]);

  // Set up keyboard shortcut listener (Ctrl+Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+C (or Cmd+Shift+C on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        console.log('Keyboard shortcut detected: Ctrl+Shift+C');
        e.preventDefault(); // Prevent the browser's default copy behavior
        
        // Check if there's any text currently selected
        const selectionObj = window.getSelection();
        if (selectionObj && !selectionObj.isCollapsed) {
          // Set the shortcut triggered flag for visual feedback
          setShortcutTriggered(true);
          
          // Trigger the selection capture
          handleTextSelection();
        }
      }
    };

    // Add global keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTextSelection]);

  // Manually trigger selection capturing
  const captureSelection = useCallback(() => {
    handleTextSelection();
  }, [handleTextSelection]);

  // Clear the current selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    if (onSelectionCleared) {
      console.log('Calling onSelectionCleared callback');
      onSelectionCleared();
    }
  }, [onSelectionCleared]);

  return {
    selection,
    lastMouseUpTarget,
    captureSelection,
    clearSelection
  };
}; 