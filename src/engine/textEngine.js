/**
 * Text Engine - Escape sequences processing
 */

export const parseTextTokens = (text) => {
  const tokens = [];
  let currentColor = '#ffffff';
  let currentBold = false;
  let currentItalic = false;
  let i = 0;
  
  while (i < text.length) {
    // Check for pause: \* or \**
    if (text[i] === '\\' && i + 1 < text.length) {
      if (text[i + 1] === '*') {
        if (text[i + 2] === '*') {
          tokens.push({ type: 'pause', duration: 1000 });
          i += 3;
          continue;
        } else {
          tokens.push({ type: 'pause', duration: 250 });
          i += 2;
          continue;
        }
      }
    }
    
    // Check for color: \c[#hex]
    if (text[i] === '\\' && text[i + 1] === 'c' && text[i + 2] === '[') {
      const closeBracket = text.indexOf(']', i + 3);
      if (closeBracket !== -1) {
        currentColor = text.substring(i + 3, closeBracket);
        tokens.push({ type: 'color', color: currentColor });
        i = closeBracket + 1;
        continue;
      }
    }
    
    // ← AGGIUNGI: Check for bold: [b]
    if (text[i] === '[' && text[i + 1] === 'b' && text[i + 2] === ']') {
      currentBold = true;
      i += 3;
      continue;
    }
    
    // ← AGGIUNGI: Check for bold end: [/b]
    if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'b' && text[i + 3] === ']') {
      currentBold = false;
      i += 4;
      continue;
    }
    
    // ← AGGIUNGI: Check for italic: [i]
    if (text[i] === '[' && text[i + 1] === 'i' && text[i + 2] === ']') {
      currentItalic = true;
      i += 3;
      continue;
    }
    
    // ← AGGIUNGI: Check for italic end: [/i]
    if (text[i] === '[' && text[i + 1] === '/' && text[i + 2] === 'i' && text[i + 3] === ']') {
      currentItalic = false;
      i += 4;
      continue;
    }
    
    // Regular character - accumulate into text token
    let textContent = '';
    while (i < text.length) {
      const char = text[i];
      
      // Stop if we hit an escape sequence or markup
      if (char === '\\' || (char === '[' && (
        (text[i + 1] === 'b' && text[i + 2] === ']') ||
        (text[i + 1] === 'i' && text[i + 2] === ']') ||
        (text[i + 1] === '/' && text[i + 2] === 'b') ||
        (text[i + 1] === '/' && text[i + 2] === 'i')
      ))) {
        break;
      }
      
      textContent += char;
      i++;
    }
    
    if (textContent.length > 0) {
      tokens.push({ 
        type: 'text', 
        content: textContent, 
        color: currentColor,
        bold: currentBold,
        italic: currentItalic
      });
    }
  }
  
  return tokens;
};

export const getPlainText = (text) => {
  return text
    .replace(/\\\*\*/g, '')  // Remove \**
    .replace(/\\\*/g, '')     // Remove \*
    .replace(/\\c\[#[0-9a-fA-F]{6}\]/g, '')  // Remove \c[#hex]
    .replace(/\[b\]/g, '')    // ← Remove [b]
    .replace(/\[\/b\]/g, '')  // ← Remove [/b]
    .replace(/\[i\]/g, '')    // ← Remove [i]
    .replace(/\[\/i\]/g, ''); // ← Remove [/i]
};

export const measureTextWidth = (ctx, text, font) => {
  ctx.font = font;
  const plainText = getPlainText(text);
  return ctx.measureText(plainText).width;
};