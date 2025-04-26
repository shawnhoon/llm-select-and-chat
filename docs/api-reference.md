# API Reference

## Components

### SelectableImage

A component that makes images selectable for inclusion in the selection context.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | Required | The source URL of the image |
| `alt` | `string` | `'Selectable image'` | Alt text description of the image |
| `width` | `string \| number` | `undefined` | Width of the image |
| `height` | `string \| number` | `undefined` | Height of the image |
| `className` | `string` | `undefined` | Additional CSS class for styling |
| `style` | `React.CSSProperties` | `undefined` | Inline styles for the image container |

#### Example

```jsx
import { SelectableImage } from 'llm-select-and-chat';

function ImageGallery() {
  return (
    <div className="gallery">
      <SelectableImage 
        src="/image1.jpg" 
        alt="Description of image 1" 
        width={200}
      />
    </div>
  );
}
```

### ImageSelectionPanel

A panel component that allows users to manage image selections and upload new images.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | Required | Controls panel visibility |
| `onClose` | `() => void` | Required | Callback when panel is closed |

#### Example

```jsx
import { ImageSelectionPanel } from 'llm-select-and-chat';

function ImageSelector() {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <button onClick={() => setVisible(true)}>
        Select Images
      </button>
      
      <ImageSelectionPanel 
        visible={visible} 
        onClose={() => setVisible(false)} 
      />
    </>
  );
}
```

## Hooks

### useSelectionCapture

Hook that manages text and image selections.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `object` | `{}` | Configuration options |
| `options.autoCapture` | `boolean` | `true` | Whether to automatically capture text selections |
| `options.onTextSelected` | `(selection: Selection) => void` | `undefined` | Callback when text is selected |
| `options.extractFullDocument` | `boolean` | `false` | Whether to extract the full document text |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `selection` | `Selection \| null` | Current selection object including any selected images |
| `captureSelection` | `() => void` | Function to manually trigger selection capture |
| `clearSelection` | `() => void` | Function to clear the current selection |
| `toggleImageSelection` | `(imageElement: HTMLImageElement) => void` | Function to toggle selection state of an image |
| `selectedImages` | `Attachment[]` | Array of currently selected images |

#### Example

```jsx
import { useSelectionCapture } from 'llm-select-and-chat';

function SelectionHandler() {
  const { 
    selection, 
    captureSelection, 
    clearSelection,
    toggleImageSelection,
    selectedImages 
  } = useSelectionCapture({
    onTextSelected: (selection) => console.log('Selected:', selection)
  });
  
  return (
    <div>
      <button onClick={captureSelection}>Capture Selection</button>
      <button onClick={clearSelection}>Clear</button>
      
      <div>
        {selectedImages.length > 0 && (
          <div>
            <h3>Selected Images: {selectedImages.length}</h3>
            {/* Render thumbnails etc */}
          </div>
        )}
      </div>
    </div>
  );
}
```

### useSelectionCaptureContext

Hook to access the selection capture context from within components.

#### Returns

Same as `useSelectionCapture` but accessed from context.

#### Example

```jsx
import { useSelectionCaptureContext } from 'llm-select-and-chat';

function ImageComponent({ src, alt }) {
  const { toggleImageSelection, selectedImages } = useSelectionCaptureContext();
  const isSelected = selectedImages.some(img => img.url === src);
  
  return (
    <img 
      src={src} 
      alt={alt}
      className={isSelected ? 'selected' : ''}
      onClick={(e) => toggleImageSelection(e.target)}
    />
  );
}
```

## Interfaces

### Selection

```typescript
interface Selection {
  text: string;
  contextBefore?: string;
  contextAfter?: string;
  url?: string;
  location?: string;
  fullDocument?: string;
  attachments?: Attachment[]; // Selected images
}
```

### Attachment

```typescript
interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  data?: Blob | string;
  mimeType?: string;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) | Capture the current text selection along with any selected images | 