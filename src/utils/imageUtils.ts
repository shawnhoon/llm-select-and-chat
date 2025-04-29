import { Attachment } from '../types';

/**
 * Optimizes an image attachment by resizing if needed
 * @param attachment The image attachment to optimize
 * @param maxWidth Maximum width for the optimized image
 * @param maxHeight Maximum height for the optimized image
 * @returns The optimized attachment with MIME type
 */
export async function optimizeImageAttachment(
  attachment: Attachment,
  maxWidth = 800,
  maxHeight = 800
): Promise<Attachment & { mimeType: string }> {
  if (attachment.type !== 'image') {
    throw new Error(`Unsupported attachment type: ${attachment.type}`);
  }

  if (!(attachment.data instanceof Blob)) {
    return {
      ...attachment,
      mimeType: attachment.mimeType || 'image/jpeg'
    };
  }

  const optimizedBlob = await optimizeImage(attachment.data, maxWidth, maxHeight);
  
  return {
    ...attachment,
    data: optimizedBlob,
    mimeType: optimizedBlob.type || attachment.mimeType || 'image/jpeg'
  };
}

/**
 * Optimizes an image by resizing it if needed
 * @param imageData The image data as a Blob
 * @param maxWidth Maximum width for the optimized image
 * @param maxHeight Maximum height for the optimized image
 * @returns A promise that resolves to the optimized image Blob
 */
async function optimizeImage(imageData: Blob, maxWidth = 800, maxHeight = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      // Check if resizing is needed
      if (img.width <= maxWidth && img.height <= maxHeight) {
        resolve(imageData); // No resizing needed
        return;
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > maxWidth) {
        newHeight = Math.floor(newHeight * (maxWidth / newWidth));
        newWidth = maxWidth;
      }
      
      if (newHeight > maxHeight) {
        newWidth = Math.floor(newWidth * (maxHeight / newHeight));
        newHeight = maxHeight;
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and resize image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        imageData.type || 'image/jpeg',
        0.9 // Quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'));
    
    // Create object URL from blob
    img.src = URL.createObjectURL(imageData);
  });
} 