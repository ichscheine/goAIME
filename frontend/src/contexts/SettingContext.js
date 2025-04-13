import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // App settings with defaults
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [showAudio, setShowAudio] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('amc_app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed) {
        setDarkMode(parsed.darkMode ?? false);
        setFontSize(parsed.fontSize ?? 'medium');
        setShowAudio(parsed.showAudio ?? true);
        setShowFeedback(parsed.showFeedback ?? true);
        setAutoAdvance(parsed.autoAdvance ?? false);
      }
    }
    
    // Apply dark mode if set
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      darkMode,
      fontSize,
      showAudio,
      showFeedback,
      autoAdvance
    };
    
    localStorage.setItem('amc_app_settings', JSON.stringify(settings));
  }, [darkMode, fontSize, showAudio, showFeedback, autoAdvance]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  
  // Update font size
  const updateFontSize = (size) => {
    if (['small', 'medium', 'large'].includes(size)) {
      setFontSize(size);
    }
  };
  
  return (
    <SettingsContext.Provider value={{
      darkMode,
      fontSize,
      showAudio,
      showFeedback,
      autoAdvance,
      toggleDarkMode,
      updateFontSize,
      setShowAudio,
      setShowFeedback,
      setAutoAdvance
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);