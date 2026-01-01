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
    // Fallback: instant transition
    ctx.drawImage(newCanvas, 0, 0);
    return;
  }

  // Create temporary canvas for gradient
  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = width;
  gradientCanvas.height = height;
  const gradCtx = gradientCanvas.getContext('2d');
  
  // Draw and analyze gradient
  gradCtx.drawImage(gradientImage, 0, 0, width, height);
  const gradientData = gradCtx.getImageData(0, 0, width, height);
  
  // Draw old scene
  ctx.drawImage(oldCanvas, 0, 0);
  
  // Get pixel data from new scene
  const newCtx = newCanvas.getContext('2d');
  const newData = newCtx.getImageData(0, 0, width, height);
  const currentData = ctx.getImageData(0, 0, width, height);
  
  // Apply gradient wipe
  const threshold = progress * 255; // 0-255 based on progress
  
  for (let i = 0; i < gradientData.data.length; i += 4) {
    const gradientValue = gradientData.data[i]; // Use red channel
    
    if (gradientValue <= threshold) {
      // Show new scene pixel
      currentData.data[i] = newData.data[i];
      currentData.data[i + 1] = newData.data[i + 1];
      currentData.data[i + 2] = newData.data[i + 2];
      currentData.data[i + 3] = newData.data[i + 3];
    }
  }
  
  ctx.putImageData(currentData, 0, 0);
};

export const captureScene = (canvas) => {
  const snapshot = document.createElement('canvas');
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const ctx = snapshot.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  return snapshot;
};