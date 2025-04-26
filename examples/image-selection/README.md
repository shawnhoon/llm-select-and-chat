# Image Selection Example

This example demonstrates how to use the SelectableImage component to allow users to select images and send them to the chat interface along with text selections.

## Features

- Select images by clicking on them
- Select text using standard selection methods
- Combine text and image selections into a single context
- Visual indication of selected images
- Keyboard shortcut support (Ctrl+Shift+C)
- Debug panel showing current selection state

## How It Works

1. The example integrates `SelectableImage` into a standard HTML page
2. Images are wrapped with selection indicators and click handlers
3. Selected images are added to the `attachments` array of the Selection object
4. The chat interface displays both text and image context together

## Getting Started

To run this example:

```bash
# Navigate to the examples directory
cd examples

# Install dependencies
npm install

# Start the server
npm start
```

Then open your browser to [http://localhost:3000/examples/image-selection/](http://localhost:3000/examples/image-selection/)

## Implementation Details

### SelectionCapture Provider

The SelectionCapture provider manages both text and image selections:

```javascript
// Set up the provider
const selectChatObj = window.LLMSelectAndChat.initSelectChat({
  // other config...
  onSelectionChange: (selection) => {
    console.log('Selection changed:', selection ? {
      text: selection.text ? selection.text.substring(0, 30) + '...' : 'none',
      hasAttachments: !!selection?.attachments?.length
    } : null);
  }
});
```

### Image Selection Logic

Images become selectable through click handlers:

```javascript
function imageClickHandler() {
  // Toggle selected state visually
  this.classList.toggle('selected');
  
  const imageUrl = this.src;
  const imageAlt = this.alt;
  
  if (this.classList.contains('selected')) {
    // Add to selected images
    const newImage = {
      id: `img_${Date.now()}`,
      type: 'image',
      name: imageAlt || 'Image',
      url: imageUrl,
      mimeType: 'image/jpeg'
    };
    
    selectedImages.push(newImage);
  } else {
    // Remove from selected images
    selectedImages = selectedImages.filter(img => img.url !== imageUrl);
  }
  
  // Update the selection
  updateSelection();
}
```

## Customization

You can customize the visual appearance of selected images by modifying the CSS:

```css
.selectable-image {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.selectable-image.selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}
```

## Using in Your Project

To implement this in your own project, you can use the `SelectableImage` component:

```jsx
import { SelectChat, SelectableImage } from 'llm-select-and-chat';

function App() {
  return (
    <div>
      <div className="content">
        <p>Select this text and images together.</p>
        <SelectableImage src="/image1.jpg" alt="Image 1" />
        <SelectableImage src="/image2.jpg" alt="Image 2" />
      </div>
      <SelectChat apiKey="your-api-key" />
    </div>
  );
}
```

## Additional Resources

For more information on working with image selections, see:

- [Image Selection and Attachments Guide](../../docs/image-selection.md)
- [API Reference - SelectableImage](../../docs/api-reference.md#selectableimage) 