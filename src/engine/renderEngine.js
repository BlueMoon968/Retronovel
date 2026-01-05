/**
 * Render Engine - Core rendering functions
 * Single source of truth for all visual novel rendering
 */

/**
 * Build font string with style modifiers
 */

const buildFontString = (size, family, bold = false, italic = false) => {
  const style = italic ? 'italic ' : '';
  const weight = bold ? 'bold ' : '';
  return `${style}${weight}${size}px ${family}`;
};

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
    // (copia funzione parseTextTokens da textEngine.js inline)
    const tokens = [];
    let currentColor = '#ffffff';
    let currentBold = false;
    let currentItalic = false;
    let i = 0;
    
    while (i < text.length) {
      if (text[i] === '\\' && i + 1 < text.length) {
        if (text[i + 1] === '*') {
          if (text[i + 2] === '*') { tokens.push({ type: 'pause', duration: 1000 }); i += 3; continue; }
          else { tokens.push({ type: 'pause', duration: 250 }); i += 2; continue; }
        }
      }
      if (text[i] === '\\' && text[i + 1] === 'c' && text[i + 2] === '[') {
        const closeBracket = text.indexOf(']', i + 3);
        if (closeBracket !== -1) {
          currentColor = text.substring(i + 3, closeBracket);
          tokens.push({ type: 'color', color: currentColor });
          i = closeBracket + 1;
          continue;
        }
      }
      if (text[i] === '[' && text[i + 1] === 'b' && text[i + 2] === ']') { currentBold = true; i += 3; continue; }
      if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'b' && text[i + 3] === ']') { currentBold = false; i += 4; continue; }
      if (text[i] === '[' && text[i + 1] === 'i' && text[i + 2] === ']') { currentItalic = true; i += 3; continue; }
      if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'i' && text[i + 3] === ']') { currentItalic = false; i += 4; continue; }
      
      let textContent = '';
      while (i < text.length) {
        const char = text[i];
        if (char === '\\' || (char === '[' && (
          (text[i + 1] === 'b' && text[i + 2] === ']') ||
          (text[i + 1] === 'i' && text[i + 2] === ']') ||
          (text[i + 1] === '/' && text[i + 2] === 'b') ||
          (text[i + 1] === '/' && text[i + 2] === 'i')
        ))) break;
        textContent += char;
        i++;
      }
      if (textContent.length > 0) {
        tokens.push({ type: 'text', content: textContent, color: currentColor, bold: currentBold, italic: currentItalic });
      }
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
  
  // Render speaker name with styles
  const tokens = parseTextTokens(speaker);
  let x = nameBoxX + 8;
  
  tokens.forEach(token => {
    if (token.type === 'text') {
      ctx.fillStyle = token.color;
      ctx.font = buildFontString(8, fontFamily, token.bold, token.italic);
      ctx.fillText(token.content, x, nameBoxY + 11);
      x += ctx.measureText(token.content).width;
    }
  });
};

export const drawDialogueText = (ctx, text, boxX, boxY, boxWidth, fontFamily) => {
  const maxWidth = boxWidth - 16;
  let y = boxY + 16;
  const lineHeight = 12;
  
  // ← MODIFICA: Parse tokens (inline copy from textEngine.js)
  const parseTextTokens = (text) => {
    const tokens = [];
    let currentColor = '#ffffff';
    let currentBold = false;
    let currentItalic = false;
    let i = 0;
    
    while (i < text.length) {
      if (text[i] === '\\' && i + 1 < text.length) {
        if (text[i + 1] === '*') {
          if (text[i + 2] === '*') { tokens.push({ type: 'pause', duration: 1000 }); i += 3; continue; }
          else { tokens.push({ type: 'pause', duration: 250 }); i += 2; continue; }
        }
      }
      if (text[i] === '\\' && text[i + 1] === 'c' && text[i + 2] === '[') {
        const closeBracket = text.indexOf(']', i + 3);
        if (closeBracket !== -1) {
          currentColor = text.substring(i + 3, closeBracket);
          tokens.push({ type: 'color', color: currentColor });
          i = closeBracket + 1;
          continue;
        }
      }
      if (text[i] === '[' && text[i + 1] === 'b' && text[i + 2] === ']') { currentBold = true; i += 3; continue; }
      if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'b' && text[i + 3] === ']') { currentBold = false; i += 4; continue; }
      if (text[i] === '[' && text[i + 1] === 'i' && text[i + 2] === ']') { currentItalic = true; i += 3; continue; }
      if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'i' && text[i + 3] === ']') { currentItalic = false; i += 4; continue; }
      
      let textContent = '';
      while (i < text.length) {
        const char = text[i];
        if (char === '\\' || (char === '[' && (
          (text[i + 1] === 'b' && text[i + 2] === ']') ||
          (text[i + 1] === 'i' && text[i + 2] === ']') ||
          (text[i + 1] === '/' && text[i + 2] === 'b') ||
          (text[i + 1] === '/' && text[i + 2] === 'i')
        ))) break;
        textContent += char;
        i++;
      }
      if (textContent.length > 0) {
        tokens.push({ type: 'text', content: textContent, color: currentColor, bold: currentBold, italic: currentItalic });
      }
    }
    return tokens;
  };
  
  const tokens = parseTextTokens(text);
  
  // Convert tokens to word array with style info
  const styledWords = [];
  tokens.forEach(token => {
    if (token.type === 'text') {
      const words = token.content.split(' ');
      words.forEach((word, idx) => {
        if (word.length > 0) {
          styledWords.push({
            text: word + (idx < words.length - 1 ? ' ' : ''),
            color: token.color,
            bold: token.bold,
            italic: token.italic
          });
        }
      });
    }
  });
  
  // Word-wrap with styles
  let currentLine = [];
  let currentLineWidth = 0;
  
  styledWords.forEach(word => {
    ctx.font = buildFontString(8, fontFamily, word.bold, word.italic);
    const wordWidth = ctx.measureText(word.text).width;
    
    if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
      // Render current line
      let x = boxX + 8;
      currentLine.forEach(w => {
        ctx.fillStyle = w.color;
        ctx.font = buildFontString(8, fontFamily, w.bold, w.italic);
        ctx.fillText(w.text, x, y);
        x += ctx.measureText(w.text).width;
      });
      
      // New line
      y += lineHeight;
      currentLine = [word];
      currentLineWidth = wordWidth;
    } else {
      currentLine.push(word);
      currentLineWidth += wordWidth;
    }
  });
  
  // Render last line
  if (currentLine.length > 0) {
    let x = boxX + 8;
    currentLine.forEach(w => {
      ctx.fillStyle = w.color;
      ctx.font = buildFontString(8, fontFamily, w.bold, w.italic);
      ctx.fillText(w.text, x, y);
      x += ctx.measureText(w.text).width;
    });
  }
  
  return y;
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
