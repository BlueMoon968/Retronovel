import { useEffect, useRef, useState } from 'react';

const TypewriterText = ({ 
  text, 
  isPlaying,
  speed = 30, // ms per character
  onComplete,
  onLetterSound,
  fontFamily = 'dogica, monospace'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const currentIndex = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;

    currentIndex.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      if (currentIndex.current < text.length) {
        const char = text[currentIndex.current];
        setDisplayedText(prev => prev + char);
        
        // Play letter sound for non-space characters
        if (char !== ' ' && onLetterSound) {
          // Random pitch variation between -0.1 and +0.1
          const pitchVariation = (Math.random() - 0.5) * 0.2;
          onLetterSound(pitchVariation);
        }
        
        currentIndex.current++;
      } else {
        clearInterval(intervalRef.current);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, isPlaying, speed]);

  const skipTypewriter = () => {
    if (isTyping) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setDisplayedText(text);
      setIsTyping(false);
      if (onComplete) onComplete();
      return true; // Indica che ha skippato
    }
    return false; // Indica che era già completo
  };

  // Esponi la funzione skip al parent
  useEffect(() => {
    // Store skip function in a global ref accessible by parent
    if (window.typewriterSkip) {
      window.typewriterSkip = skipTypewriter;
    }
  }, [isTyping]);

  return {
    displayedText,
    isTyping,
    skipTypewriter
  };
};

export default TypewriterText;