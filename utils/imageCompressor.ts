// utils/imageCompressor.ts
export const compressImage = (
  file: File,
  maxWidth = 300,
  maxHeight = 450,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetRatio = maxWidth / maxHeight; // 2:3 (0.6667)
        const srcRatio = img.width / img.height;

        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        // Center-crop to maintain 2:3 vertical aspect ratio without distortion
        if (srcRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else if (srcRatio < targetRatio) {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Failed to get canvas context');

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maxWidth, maxHeight);
        // Export as WebP base64
        const compressedBase64 = canvas.toDataURL('image/webp', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
