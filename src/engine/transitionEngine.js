/**
 * Gradient Wipe Transition Engine
 * Uses a gradient image to create smooth scene transitions
 */

export const performGradientWipe = (
  ctx,
  oldCanvas,
  newCanvas,
  gradientImage,
  progress,
  width,
  height
) => {
  if (!gradientImage || !gradientImage.complete) {
    // Fallback: draw new scene directly
    ctx.drawImage(newCanvas, 0, 0);
    return;
  }

  // Clear and draw old scene
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(oldCanvas, 0, 0);
  
  // Create gradient mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  
  // Draw gradient at full size
  maskCtx.drawImage(gradientImage, 0, 0, width, height);
  const gradientData = maskCtx.getImageData(0, 0, width, height);
  
  // Get new scene data
  const newCtx = newCanvas.getContext('2d', { willReadFrequently: true });
  const newImageData = newCtx.getImageData(0, 0, width, height);
  
  // Get current display data
  const currentImageData = ctx.getImageData(0, 0, width, height);
  
  // Calculate threshold (0-255)
  const threshold = Math.floor(progress * 255);
  
  // Apply gradient wipe pixel by pixel
  for (let i = 0; i < gradientData.data.length; i += 4) {
    // Use grayscale value (all channels should be same in gradient)
    const gradValue = gradientData.data[i];
    
    // If gradient value is less than threshold, show new scene
    if (gradValue < threshold) {
      currentImageData.data[i] = newImageData.data[i];         // R
      currentImageData.data[i + 1] = newImageData.data[i + 1]; // G
      currentImageData.data[i + 2] = newImageData.data[i + 2]; // B
      currentImageData.data[i + 3] = newImageData.data[i + 3]; // A
    }
  }
  
  // Put modified image back
  ctx.putImageData(currentImageData, 0, 0);
};

export const captureScene = (canvas) => {
  const snapshot = document.createElement('canvas');
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const ctx = snapshot.getContext('2d', { alpha: false });
  ctx.drawImage(canvas, 0, 0);
  return snapshot;
};