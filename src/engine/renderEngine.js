/**
 * Render Engine - Core rendering functions
 * Single source of truth for all visual novel rendering
 */

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

export const drawNameBox = (ctx, nameBoxImage, speaker, boxX, boxY, fontFamily) => {
  // ← IMPORT parseTextTokens inline per evitare circular dependency
  const parseTextTokens = (text) => {
    const tokens = [];
    let pos = 0;
    let currentColor = '#ffffff';
    
    while (pos < text.length) {
      if (text.substr(pos, 3) === '\\**') { pos += 3; continue; }
      if (text.substr(pos, 2) === '\\*') { pos += 2; continue; }
      
      const colorMatch = text.substr(pos).match(/^\\c\[([#\w]+)\]/);
      if (colorMatch) {
        currentColor = colorMatch[1];
        tokens.push({ type: 'color', color: currentColor });
        pos += colorMatch[0].length;
        continue;
      }
      
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'text' && lastToken.color === currentColor) {
        lastToken.content += text[pos];
      } else {
        tokens.push({ type: 'text', content: text[pos], color: currentColor });
      }
      pos++;
    }
    return tokens;
  };
  
  const getPlainText = (text) => text.replace(/\\\*\*/g, '').replace(/\\\*/g, '').replace(/\\c\[[#\w]+\]/g, '');
  
  if (!speaker || speaker.trim() === '') return;
  
  ctx.font = 'bold 8px ' + fontFamily;
  const nameWidth = ctx.measureText(getPlainText(speaker)).width;
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
  
  // ← Render speaker name with color support
  const tokens = parseTextTokens(speaker);
  let x = nameBoxX + 8;
  ctx.font = 'bold 8px ' + fontFamily;
  
  tokens.forEach(token => {
    if (token.type === 'color') {
      // Color change
    } else if (token.type === 'text') {
      ctx.fillStyle = token.color;
      ctx.fillText(token.content, x, nameBoxY + 11);
      x += ctx.measureText(token.content).width;
    }
  });
};

export const drawDialogueText = (ctx, text, boxX, boxY, boxWidth, fontFamily) => {
  // ← IMPORT functions inline
  const parseTextTokens = (text) => {
    const tokens = [];
    let pos = 0;
    let currentColor = '#ffffff';
    
    while (pos < text.length) {
      if (text.substr(pos, 3) === '\\**') { pos += 3; continue; }
      if (text.substr(pos, 2) === '\\*') { pos += 2; continue; }
      
      const colorMatch = text.substr(pos).match(/^\\c\[([#\w]+)\]/);
      if (colorMatch) {
        currentColor = colorMatch[1];
        tokens.push({ type: 'color', color: currentColor });
        pos += colorMatch[0].length;
        continue;
      }
      
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'text' && lastToken.color === currentColor) {
        lastToken.content += text[pos];
      } else {
        tokens.push({ type: 'text', content: text[pos], color: currentColor });
      }
      pos++;
    }
    return tokens;
  };
  
  ctx.font = '8px ' + fontFamily;
  
  const maxWidth = boxWidth - 16;
  let x = boxX + 8;
  let y = boxY + 16;
  const lineHeight = 12;
  let currentLineWidth = 0;
  let currentColor = '#ffffff';
  
  const tokens = parseTextTokens(text);
  
  tokens.forEach(token => {
    if (token.type === 'color') {
      currentColor = token.color;
      return;
    }
    
    if (token.type === 'text') {
      const words = token.content.split(' ');
      
      words.forEach((word, idx) => {
        const wordWithSpace = idx < words.length - 1 ? word + ' ' : word;
        const wordWidth = ctx.measureText(wordWithSpace).width;
        
        if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
          // New line
          x = boxX + 8;
          y += lineHeight;
          currentLineWidth = 0;
        }
        
        ctx.fillStyle = currentColor;
        ctx.fillText(wordWithSpace, x, y);
        x += wordWidth;
        currentLineWidth += wordWidth;
      });
    }
  });
};

export const drawChoices = (ctx, dialogue, canvasWidth, canvasHeight, fontFamily) => {
  if (!dialogue.choices || dialogue.choices.length === 0) return null;
  
  const numChoices = dialogue.choices.length;
  const baseChoiceHeight = 16;
  const choiceSpacing = 4;
  const choiceWidth = 200;
  
  // Adjust height and font based on number of choices
  const choiceHeight = numChoices > 4 ? 12 : (numChoices > 2 ? 14 : baseChoiceHeight);
  const fontSize = numChoices > 4 ? '7px' : '8px';
  
  // Calculate total height
  const totalHeight = (numChoices * choiceHeight) + ((numChoices - 1) * choiceSpacing);
  
  // Position choices ABOVE the dialogue box (which is at canvasHeight - 60)
  const dialogueBoxY = canvasHeight - 60;
  const choicesY = dialogueBoxY - totalHeight - 10; // 10px margin
  
  // If choices would go off top, center them instead
  const startY = choicesY < 10 ? Math.max(10, (canvasHeight - totalHeight) / 2) : choicesY;
  const startX = (canvasWidth - choiceWidth) / 2;
  
  const choicePositions = [];

  dialogue.choices.forEach((choice, idx) => {
    const choiceY = startY + (idx * (choiceHeight + choiceSpacing));
    
    ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
    ctx.fillRect(startX, choiceY, choiceWidth, choiceHeight);
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, choiceY, choiceWidth, choiceHeight);
    
    ctx.fillStyle = '#fff';
    ctx.font = fontSize + ' ' + fontFamily;
    
    let choiceText = choice.text;
    const maxWidth = choiceWidth - 20;
    let textWidth = ctx.measureText('▸ ' + choiceText).width;
    while (textWidth > maxWidth && choiceText.length > 3) {
      choiceText = choiceText.slice(0, -1);
      textWidth = ctx.measureText('▸ ' + choiceText + '...').width;
    }
    if (choiceText !== choice.text) choiceText += '...';
    
    const textY = choiceY + (choiceHeight / 2) + 3;
    ctx.fillText('▸ ' + choiceText, startX + 8, textY);
    
    choicePositions.push({
      x: startX,
      y: choiceY,
      width: choiceWidth,
      height: choiceHeight,
      choice: choice
    });
  });
  
  return choicePositions;
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

export const drawSceneIndicator = (ctx, currentScene, totalScenes, fontFamily) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, 80, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px ' + fontFamily;
  ctx.fillText('Scene ' + (currentScene + 1) + '/' + totalScenes, 4, 10);
};

// Export functions as string for HTML export
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
