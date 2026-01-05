/**
 * Text Engine - Escape sequences processing
 */

export const parseTextTokens = (text) => {
  const tokens = [];
  let pos = 0;
  let currentColor = '#ffffff';
  
  while (pos < text.length) {
    // Check for \**
    if (text.substr(pos, 3) === '\\**') {
      tokens.push({ type: 'pause', duration: 1000 });
      pos += 3;
      continue;
    }
    
    // Check for \*
    if (text.substr(pos, 2) === '\\*') {
      tokens.push({ type: 'pause', duration: 250 });
      pos += 2;
      continue;
    }
    
    // Check for \c[#hex]
    const colorMatch = text.substr(pos).match(/^\\c\[([#\w]+)\]/);
    if (colorMatch) {
      currentColor = colorMatch[1];
      tokens.push({ type: 'color', color: currentColor });
      pos += colorMatch[0].length;
      continue;
    }
    
    // Regular text character
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

export const getPlainText = (text) => {
  // Remove all escape sequences for plain text
  return text
    .replace(/\\\*\*/g, '')
    .replace(/\\\*/g, '')
    .replace(/\\c\[[#\w]+\]/g, '');
};

export const measureTextWidth = (ctx, text, font) => {
  ctx.font = font;
  const plainText = getPlainText(text);
  return ctx.measureText(plainText).width;
};