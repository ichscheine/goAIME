import { useState, useEffect, useRef } from 'react';

export const DEFAULT_ASSETS = {
  sounds: {
    correct: 'https://goaime-assets.s3.us-east-1.amazonaws.com/sounds/correct.mp3',
    incorrect: 'https://goaime-assets.s3.us-east-1.amazonaws.com/sounds/incorrect.mp3'
  },
  images: {
    feedback: {
      correct: 'https://goaime-assets.s3.us-east-1.amazonaws.com/images/correct.gif',
      incorrect: 'https://goaime-assets.s3.us-east-1.amazonaws.com/images/incorrect.gif'
    }
  }
};

export const useAudio = () => {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const correctAudioRef = useRef(new Audio(DEFAULT_ASSETS.sounds.correct));
  const incorrectAudioRef = useRef(new Audio(DEFAULT_ASSETS.sounds.incorrect));

  useEffect(() => {
    const correctAudio = correctAudioRef.current;
    const incorrectAudio = incorrectAudioRef.current;
    
    // Audio load handlers
    const handleLoaded = () => setAudioLoaded(true);
    const handleError = (e) => {
      console.error("Audio loading error:", e);
      setAudioLoaded(false);
    };
    
    correctAudio.addEventListener('canplaythrough', handleLoaded);
    correctAudio.addEventListener('error', handleError);
    incorrectAudio.addEventListener('canplaythrough', handleLoaded);
    incorrectAudio.addEventListener('error', handleError);
    
    // Attempt to load
    correctAudio.load();
    incorrectAudio.load();
    
    return () => {
      correctAudio.removeEventListener('canplaythrough', handleLoaded);
      correctAudio.removeEventListener('error', handleError);
      incorrectAudio.removeEventListener('canplaythrough', handleLoaded);
      incorrectAudio.removeEventListener('error', handleError);
    };
  }, []);
  
  // Play audio functions
  const playCorrect = async () => {
    try {
      const audio = correctAudioRef.current;
      audio.currentTime = 0;
      await audio.play();
    } catch (err) {
      console.error("Error playing correct sound:", err);
    }
  };
  
  const playIncorrect = async () => {
    try {
      const audio = incorrectAudioRef.current;
      audio.currentTime = 0;
      await audio.play();
    } catch (err) {
      console.error("Error playing incorrect sound:", err);
    }
  };
  
  return {
    audioLoaded,
    playCorrect,
    playIncorrect
  };
};

export default useAudio;