// Funzioni di rendering pure - usate sia in editor che in export

export const drawNinePatch = (ctx, image, x, y, width, height) => {
  if (!image || !image.complete) return false;
  
  const srcSize = 16;
  const corner = 5;
  const edge = 6;
  
  // Corners
  ctx.drawImage(image, 0, 0, corner, corner, x, y, corner, corner);
  ctx.drawImage(image, srcSize - corner, 0, corner, corner, x + width - corner, y, corner, corner);
  ctx.drawImage(image, 0, srcSize - corner, corner, corner, x, y + height - corner, corner, corner);
  ctx.drawImage(image, srcSize - corner, srcSize - corner, corner, corner, x + width - corner, y + height - corner, corner, corner);
  
  // Edges
  ctx.drawImage(image, corner, 0, edge, corner, x + corner, y, width - (corner * 2), corner);
  ctx.drawImage(image, corner, srcSize - corner, edge, corner, x + corner, y + height - corner, width - (corner * 2), corner);
  ctx.drawImage(image, 0, corner, corner, edge, x, y + corner, corner, height - (corner * 2));
  ctx.drawImage(image, srcSize - corner, corner, corner, edge, x + width - corner, y + corner, corner, height - (corner * 2));
  
  // Center
  ctx.drawImage(image, corner, corner, edge, edge, x + corner, y + corner, width - (corner * 2), height - (corner * 2));
  
  return true;
};

export const drawChoices = (ctx, dialogue, boxX, boxY, boxWidth, y, lineHeight, fontFamily) => {
  if (!dialogue.choices || dialogue.choices.length === 0) return;
  
  const choiceStartY = y + lineHeight + 4;
  const choiceHeight = 14;
  const choiceSpacing = 2;

  dialogue.choices.forEach((choice, idx) => {
    const choiceY = choiceStartY + (idx * (choiceHeight + choiceSpacing));
    
    ctx.fillStyle = 'rgba(41, 128, 185, 0.3)';
    ctx.fillRect(boxX + 8, choiceY, boxWidth - 16, choiceHeight);
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 8, choiceY, boxWidth - 16, choiceHeight);
    
    ctx.fillStyle = '#fff';
    ctx.font = '8px ' + fontFamily;
    ctx.fillText('▸ ' + choice.text, boxX + 12, choiceY + 9);
  });
};

export const drawDialogueText = (ctx, text, boxX, boxY, boxWidth, fontFamily) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px ' + fontFamily;
  
  const maxWidth = boxWidth - 16;
  const words = text.split(' ');
  let line = '';
  let y = boxY + 16;
  const lineHeight = 12;

  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, boxX + 8, y);
      line = word + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, boxX + 8, y);
  
  return y; // Return last Y position for choices
};

export const drawArrow = (ctx, boxX, boxY, boxWidth, boxHeight, hasMore) => {
  if (!hasMore) return;
  
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(boxX + boxWidth - 12, boxY + boxHeight - 8);
  ctx.lineTo(boxX + boxWidth - 8, boxY + boxHeight - 4);
  ctx.lineTo(boxX + boxWidth - 12, boxY + boxHeight);
  ctx.fill();
};

export const drawNameBox = (ctx, nameBoxImage, speaker, boxX, boxY, fontFamily) => {
  ctx.font = 'bold 8px ' + fontFamily;
  const nameWidth = ctx.measureText(speaker).width;
  const nameBoxWidth = nameWidth + 16;
  const nameBoxHeight = 16;
  const nameBoxX = boxX + 4;
  const nameBoxY = boxY - nameBoxHeight + 4;
  
  const nameBoxDrawn = drawNinePatch(ctx, nameBoxImage, nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight);
  if (!nameBoxDrawn) {
    ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    ctx.fillRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight);
  }
  
  // Speaker name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px ' + fontFamily;
  ctx.fillText(speaker, nameBoxX + 8, nameBoxY + 11);
};

export const drawSceneIndicator = (ctx, currentScene, totalScenes, fontFamily) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, 80, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px ' + fontFamily;
  ctx.fillText('Scene ' + (currentScene + 1) + '/' + totalScenes, 4, 10);
};

export const exportRenderFunctions = () => {
  return `
    ${drawNinePatch.toString()}
    ${drawNameBox.toString()}
    ${drawDialogueText.toString()}
    ${drawChoices.toString()}
    ${drawArrow.toString()}
    ${drawSceneIndicator.toString()}
  `;
};