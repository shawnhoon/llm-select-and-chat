# Image Selection and Attachments Guide

## Overview

LLM Select and Chat supports both text selection and image selection/attachments. This guide covers how to implement and use these features in your application.

## Image Support in Selection Context

The library allows for images to be included in selection contexts, enabling users to:
- Select text and images together
- Have the AI assistant reference and discuss both
- Create rich multimodal conversations

## Usage Examples

### Basic Image Selection

To enable users to select images along with text:

```jsx
import { SelectChat, SelectableImage } from 'llm-select-and-chat';

function App() {
  return (
    <div>
      <div className="content">
        <p>This is selectable text content.</p>
        
        <div className="image-gallery">
          <SelectableImage 
            src="/path/to/image1.jpg" 
            alt="Image 1 description" 
          />
          <SelectableImage 
            src="/path/to/image2.jpg" 
            alt="Image 2 description" 
          />
        </div>
      </div>
      
      <SelectChat apiKey="your-api-key" />
    </div>
  );
}
```

### Advanced Custom Implementation

For more control, you can use the lower-level components:

```jsx
import { 
  ChatInterface, 
  useSelectionCapture,
  SelectionCaptureProvider,
  SelectableImage 
} from 'llm-select-and-chat';

function CustomImplementation() {
  return (
    <SelectionCaptureProvider>
      <Content />
      <ChatPanel />
    </SelectionCaptureProvider>
  );
}

function Content() {
  // Using the selection capture context directly
  const { toggleImageSelection, selectedImages } = useSelectionCaptureContext();
  
  return (
    <div>
      <p>Select text or images to discuss with the AI.</p>
      
      <div className="image-gallery">
        {/* The SelectableImage component uses the context internally */}
        <SelectableImage src="/path/to/image1.jpg" alt="Description" />
        
        {/* Or implement your own selectable images */}
        <img 
          src="/path/to/image2.jpg" 
          alt="Custom implementation"
          onClick={(e) => toggleImageSelection(e.target)}
          className={selectedImages.some(img => img.url === '/path/to/image2.jpg') ? 'selected' : ''}
        />
      </div>
    </div>
  );
}

function ChatPanel() {
  const { selection } = useSelectionCaptureContext();
  
  // Implement your chat logic here using the selection data
  return (
    <ChatInterface 
      selection={selection} 
      // other props
    />
  );
}
```

## Selection Object with Attachments

When images are selected, they are added to the `attachments` array in the Selection object:

```typescript
interface Selection {
  text: string;
  contextBefore?: string;
  contextAfter?: string;
  url?: string;
  location?: string;
  fullDocument?: string;
  attachments?: Attachment[]; // Array of image attachments
}

interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  data?: Blob | string;
  mimeType?: string;
}
```

## Creating an Image Selection Panel

You can build a custom panel to let users select and upload images:

```jsx
import { ImageSelectionPanel, useSelectionCaptureContext } from 'llm-select-and-chat';

function CustomImagePanel() {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Close' : 'Select Images'}
      </button>
      
      <ImageSelectionPanel 
        visible={isVisible}
        onClose={() => setIsVisible(false)}
      />
    </>
  );
}
```

## Keyboard Shortcuts

Users can use Ctrl+Shift+C (Cmd+Shift+C on Mac) to capture the current text selection along with any selected images.

## Tracking Selection Changes

Use callbacks to track when selections (including images) change:

```jsx
<SelectChat
  apiKey="your-api-key"
  onSelectionChange={(selection) => {
    // Check if the selection includes images
    if (selection?.attachments?.length > 0) {
      console.log('Selection includes images:', selection.attachments);
    }
  }}
/>
```

## Programmatically Setting Selections with Images

You can programmatically create selections that include images:

```jsx
// Assuming you have the SelectChat API from onInit
chatApi.setSelection({
  text: "Image analysis",
  contextBefore: "Please analyze these images",
  contextAfter: "What can you tell me about them?",
  attachments: [
    {
      id: `img_${Date.now()}`,
      type: 'image',
      name: 'Sample image',
      url: 'https://example.com/image.jpg',
      mimeType: 'image/jpeg'
    }
  ]
});
```

## Styling Selected Images

The `SelectableImage` component includes visual indicators for selection state, but you can customize its appearance:

```jsx
import { SelectableImage } from 'llm-select-and-chat';
import styled from 'styled-components';

// Custom styled version of SelectableImage
const CustomSelectableImage = styled(SelectableImage)`
  border-radius: 12px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function Gallery() {
  return (
    <div className="gallery">
      <CustomSelectableImage 
        src="/image1.jpg" 
        alt="Custom styled selectable image"
      />
    </div>
  );
}
```

## Best Practices

1. **Provide meaningful alt text** for all images to help the AI understand the content
2. **Restrict image sizes** to maintain performance (both file size and dimensions)
3. **Implement visual feedback** so users understand which images are selected
4. **Handle both text-only and image-only selections** appropriately
5. **Consider loading states** for large images 