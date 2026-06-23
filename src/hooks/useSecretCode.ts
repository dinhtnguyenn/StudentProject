import { useEffect, useRef } from 'react';

export default function useSecretCode(secretCode: string, callback: () => void) {
  const sequenceRef = useRef<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Only accept single characters to avoid 'Backspace', 'Shift', etc messing up the string length easily
      // But actually, just appending is fine. We can just append.
      if (key.length === 1) {
        sequenceRef.current += key;
        
        if (sequenceRef.current.length > secretCode.length) {
          sequenceRef.current = sequenceRef.current.slice(-secretCode.length);
        }
        
        if (sequenceRef.current === secretCode.toLowerCase()) {
          callback();
          sequenceRef.current = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secretCode, callback]);
}
