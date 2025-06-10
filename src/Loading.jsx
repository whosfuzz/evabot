import { useState, useEffect } from 'react';

export default function Loading() {

      const [isDarkMode, setIsDarkMode] = useState(false);
    
    
      useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
      }, []);
    
      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      }, [isDarkMode]);

  return (
    <div className="loading-screen">
        <div className="loading-logo-placeholder">
        <img src="/eba.png" alt="Logo" />
        </div>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
    </div>
  );
}