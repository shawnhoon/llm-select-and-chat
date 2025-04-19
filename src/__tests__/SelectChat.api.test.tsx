import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectChat } from '../components/SelectChat/SelectChat';
import { Selection, Message } from '../types';

// Mock the LLMAdapterFactory to avoid actual API calls
jest.mock('../components/LLMProviderAdapter', () => ({
  LLMAdapterFactory: {
    createAdapter: () => ({
      sendMessages: jest.fn().mockResolvedValue('Mocked assistant response')
    })
  }
}));

// Mock the uuid generator for predictable IDs in tests
jest.mock('../utils/uuid', () => ({
  uuid: () => 'test-uuid'
}));

describe('SelectChat API Integration Tests', () => {
  // Test 1: onInit callback is triggered
  test('onInit callback is triggered with all required API methods', async () => {
    const mockOnInit = jest.fn();
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={mockOnInit}
      />
    );
    
    // The onInit callback should be called during component mount
    await waitFor(() => {
      expect(mockOnInit).toHaveBeenCalled();
    });
    
    // Check that all required methods are available
    const api = mockOnInit.mock.calls[0][0];
    expect(api).toHaveProperty('setSelection');
    expect(api).toHaveProperty('clearSelection');
    expect(api).toHaveProperty('focusInput');
    expect(api).toHaveProperty('isReady');
    
    // Verify each method has the correct type
    expect(typeof api.setSelection).toBe('function');
    expect(typeof api.clearSelection).toBe('function');
    expect(typeof api.focusInput).toBe('function');
    expect(typeof api.isReady).toBe('function');
  });
  
  // Test 2: isReady method returns correct value
  test('isReady method returns true after initialization', async () => {
    let apiMethods: any;
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    // isReady should return true after initialization
    expect(apiMethods.isReady()).toBe(true);
  });
  
  // Test 3: Component cleans up properly on unmount
  test('Component cleans up properly on unmount', async () => {
    let apiMethods: any;
    
    const { unmount } = render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
      expect(apiMethods.isReady()).toBe(true);
    });
    
    // Unmount the component
    act(() => {
      unmount();
    });
    
    // After unmount, isReady should return false
    expect(apiMethods.isReady()).toBe(false);
  });
  
  // Test 4: setSelection method updates selection state
  test('setSelection method updates selection state', async () => {
    let apiMethods: any;
    const mockOnSelectionChange = jest.fn();
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    // Create a test selection
    const testSelection: Selection = {
      text: 'Test selection',
      contextBefore: 'Text before.',
      contextAfter: 'Text after.',
      url: 'https://example.com',
      location: 'test'
    };
    
    // Set the selection programmatically
    act(() => {
      apiMethods.setSelection(testSelection);
    });
    
    // The onSelectionChange callback should be called with the new selection
    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(testSelection);
    });
  });
  
  // Test 5: clearSelection method clears selection state
  test('clearSelection method clears selection state', async () => {
    let apiMethods: any;
    const mockOnSelectionChange = jest.fn();
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    // Create a test selection
    const testSelection: Selection = {
      text: 'Test selection',
      contextBefore: 'Text before.',
      contextAfter: 'Text after.',
      url: 'https://example.com',
      location: 'test'
    };
    
    // First set the selection
    act(() => {
      apiMethods.setSelection(testSelection);
    });
    
    // The onSelectionChange callback should be called with the new selection
    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(testSelection);
    });
    
    // Clear the selection
    mockOnSelectionChange.mockClear(); // Reset the mock
    
    act(() => {
      apiMethods.clearSelection();
    });
    
    // The onSelectionChange callback should be called with null
    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(null);
    });
  });
  
  // Test 6: focusInput method focuses the input element
  test('focusInput method focuses the input element', async () => {
    let apiMethods: any;
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    // Create a spy for the focus method
    const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
    
    // Call the focusInput method
    act(() => {
      apiMethods.focusInput();
    });
    
    // Expect the focus method to have been called
    expect(focusSpy).toHaveBeenCalled();
    
    // Clean up the spy
    focusSpy.mockRestore();
  });
  
  // Test 7: onSelectionChange callback is triggered
  test('onSelectionChange callback is triggered when selection changes', async () => {
    const onSelectionChangeMock = jest.fn();
    let apiMethods: any;
    
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
        onSelectionChange={onSelectionChangeMock}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    const testSelection: Selection = {
      text: 'Test selection',
      contextBefore: 'Context before',
      contextAfter: 'Context after'
    };
    
    // Call the setSelection method
    act(() => {
      apiMethods.setSelection(testSelection);
    });
    
    // Expect the onSelectionChange callback to have been called with the selection
    expect(onSelectionChangeMock).toHaveBeenCalledWith(testSelection);
    
    // Clear the selection
    act(() => {
      apiMethods.clearSelection();
    });
    
    // Expect the onSelectionChange callback to have been called with null
    expect(onSelectionChangeMock).toHaveBeenCalledWith(null);
  });
  
  // Test 8: onMessage callback is triggered when a message is received
  test('onMessage callback is triggered when a message is received', async () => {
    const onMessageMock = jest.fn();
    let apiMethods: any;
    
    // Get access to the mock sendMessages function
    const sendMessagesMock = jest.requireMock('../components/LLMProviderAdapter').LLMAdapterFactory.createAdapter().sendMessages;
    
    // Extend SelectChatProps to include onMessage for testing purposes
    render(
      <SelectChat 
        apiKey="test-key"
        onInit={(api) => {
          apiMethods = api;
        }}
        // @ts-ignore - onMessage is not in the type definition but we're testing it
        onMessage={onMessageMock}
      />
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(apiMethods).toBeDefined();
    });
    
    // Mock the internal sendMessage function's behavior
    await act(async () => {
      // Simulate sending a message
      const userMessage = "Hello, world!";
      const now = Date.now();
      
      // For testing purposes, manually trigger what would happen when a message is received
      // This would typically happen through the component's UI
      const expectedMessages: Message[] = [
        { id: 'test-uuid', role: 'user', content: userMessage, timestamp: now },
        { id: 'test-uuid', role: 'assistant', content: 'Mocked assistant response', timestamp: now }
      ];
      
      // Wait for the response to be processed
      await waitFor(() => {
        expect(onMessageMock).toHaveBeenCalledTimes(2);
        expect(onMessageMock).toHaveBeenLastCalledWith(expectedMessages[1]);
      });
    });
  });
}); 