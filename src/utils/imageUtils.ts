
/**
 * Compresses an image data URL to a smaller size.
 * @param dataUrl The original data URL of the image.
 * @param maxWidth The maximum width of the compressed image.
 * @param maxHeight The maximum height of the compressed image.
 * @param quality The quality of the compression (0 to 1).
 * @returns A promise that resolves to the compressed data URL.
 */
export async function compressImage(
  dataUrl: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback to original if canvas context is not available
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Output as JPEG for better compression than PNG (base64)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = dataUrl;
  });
}

/**
 * Compresses receipt image data URLs to ensure they strictly stay within Firestore's 1MB limit
 * (typically around 60KB - 180KB) while maintaining document legibility.
 * Supports skipping background auto-crop/enhance if the image has already been manually edited.
 */
export async function compressReceiptImage(
  dataUrl: string,
  skipAutoCropAndEnhance: boolean = false
): Promise<string> {
  try {
    let result = dataUrl;
    if (!skipAutoCropAndEnhance) {
      // Apply auto-cropping & scanner-style contrast enhance first!
      result = await processAndEnhanceReceipt(dataUrl);
    }
    
    // Determine compression parameters to optimize legibility and size
    const maxW = skipAutoCropAndEnhance ? 900 : 600;
    const maxH = skipAutoCropAndEnhance ? 1300 : 900;
    const quality = skipAutoCropAndEnhance ? 0.7 : 0.45;

    // Guarantee size is well under 250KB for rapid, error-free saves
    if (result.length > 250000 || skipAutoCropAndEnhance) {
      result = await compressImage(result, maxW, maxH, quality);
    }
    return result;
  } catch (error) {
    console.error('compressReceiptImage error:', error);
    try {
      return await compressImage(dataUrl, 600, 900, 0.5);
    } catch {
      return dataUrl;
    }
  }
}

/**
 * Advanced receipt scanner filter: performs auto-cropping (border detection)
 * and enhances text readability by boosting contrast & whitening non-receipt backgrounds.
 */
export async function processAndEnhanceReceipt(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale to working size (max 900px) to keep processing blazing fast and low memory
        const maxWorkingSize = 900;
        if (width > height) {
          if (width > maxWorkingSize) {
            height = Math.round((height * maxWorkingSize) / width);
            width = maxWorkingSize;
          }
        } else {
          if (height > maxWorkingSize) {
            width = Math.round((width * maxWorkingSize) / height);
            height = maxWorkingSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get image pixel data for document scanning threshold filters
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        let minL = 255;
        let maxL = 0;

        for (let i = 0; i < data.length; i += 4) {
          const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
        }

        const range = maxL - minL;
        for (let i = 0; i < data.length; i += 4) {
          let l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (range > 15) {
            l = ((l - minL) / range) * 255;
          }

          // Document scanner effect: push light areas to pure white, darken characters
          if (l > 175) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else if (l < 75) {
            data[i] = 12;
            data[i + 1] = 12;
            data[i + 2] = 12;
          } else {
            const factor = 1.5;
            const newVal = Math.max(0, Math.min(255, (l - 128) * factor + 128));
            data[i] = newVal;
            data[i + 1] = newVal;
            data[i + 2] = newVal;
          }
        }
        ctx.putImageData(imgData, 0, 0);

        // Auto-cropping: Scan row and column averages to find the lighter receipt box
        let top = 0;
        let bottom = height - 1;
        let left = 0;
        let right = width - 1;

        const rowLuminance = new Float32Array(height);
        for (let y = 0; y < height; y++) {
          let sum = 0;
          const offset = y * width * 4;
          for (let x = 0; x < width; x++) {
            const idx = offset + x * 4;
            sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          }
          rowLuminance[y] = sum / width;
        }

        const colLuminance = new Float32Array(width);
        for (let x = 0; x < width; x++) {
          let sum = 0;
          for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          }
          colLuminance[x] = sum / height;
        }

        const bgThreshold = 225; // Since we whiten light-neutral tones
        for (let y = 0; y < height * 0.35; y++) {
          if (rowLuminance[y] < bgThreshold) {
            top = y;
            break;
          }
        }
        for (let y = height - 1; y > height * 0.65; y--) {
          if (rowLuminance[y] < bgThreshold) {
            bottom = y;
            break;
          }
        }
        for (let x = 0; x < width * 0.35; x++) {
          if (colLuminance[x] < bgThreshold) {
            left = x;
            break;
          }
        }
        for (let x = width - 1; x > width * 0.65; x--) {
          if (colLuminance[x] < bgThreshold) {
            right = x;
            break;
          }
        }

        const cropW = right - left;
        const cropH = bottom - top;

        let cropX = 0;
        let cropY = 0;
        let cropWidth = width;
        let cropHeight = height;

        // Apply detected cropped box only if it's high quality and doesn't crop out everything
        if (cropW > width * 0.45 && cropH > height * 0.45 && (cropW < width * 0.98 || cropH < height * 0.98)) {
          const pad = 12;
          cropX = Math.max(0, left - pad);
          cropY = Math.max(0, top - pad);
          cropWidth = Math.min(width - cropX, cropW + pad * 2);
          cropHeight = Math.min(height - cropY, cropH + pad * 2);
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          resolve(cropCanvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        }
      } catch (err) {
        console.error('Enhancer processing error:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = dataUrl;
  });
}

/**
 * Automatically computes bounding box ratios (0 to 1) of a receipt in an image.
 */
export function detectReceiptFractionalBounds(
  img: HTMLImageElement | HTMLCanvasElement
): { x: number; y: number; w: number; h: number } {
  try {
    const canvas = document.createElement('canvas');
    const width = 300;
    const height = Math.round((img.height * 300) / img.width);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
    }
    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const rowLuminance = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      let sum = 0;
      const offset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = offset + x * 4;
        sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      }
      rowLuminance[y] = sum / width;
    }

    const colLuminance = new Float32Array(width);
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      }
      colLuminance[x] = sum / height;
    }

    let minL = 255;
    let maxL = 0;
    for (let i = 0; i < rowLuminance.length; i++) {
      if (rowLuminance[i] < minL) minL = rowLuminance[i];
      if (rowLuminance[i] > maxL) maxL = rowLuminance[i];
    }
    const range = maxL - minL;
    const threshold = minL + range * 0.45;

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    for (let y = 0; y < height * 0.4; y++) {
      if (rowLuminance[y] > threshold) {
        top = y;
        break;
      }
    }
    for (let y = height - 1; y > height * 0.6; y--) {
      if (rowLuminance[y] > threshold) {
        bottom = y;
        break;
      }
    }
    for (let x = 0; x < width * 0.4; x++) {
      if (colLuminance[x] > threshold) {
        left = x;
        break;
      }
    }
    for (let x = width - 1; x > width * 0.6; x--) {
      if (colLuminance[x] > threshold) {
        right = x;
        break;
      }
    }

    const w = right - left;
    const h = bottom - top;

    if (w > width * 0.35 && h > height * 0.35 && w < width * 0.99 && h < height * 0.99) {
      const paddingX = 0.05; // 5% horizontal padding
      const paddingY = 0.04; // 4% vertical padding
      
      const fx = Math.max(0, (left / width) - paddingX);
      const fy = Math.max(0, (top / height) - paddingY);
      const rightFrac = Math.min(1, (right / width) + paddingX);
      const bottomFrac = Math.min(1, (bottom / height) + paddingY);
      
      const fw = rightFrac - fx;
      const fh = bottomFrac - fy;
      return { x: fx, y: fy, w: fw, h: fh };
    }
  } catch (err) {
    console.warn('Fractional detection failed:', err);
  }

  return { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
}
