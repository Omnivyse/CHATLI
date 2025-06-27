import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme, getDomTheme } from '../utils/themeUtils';

const ThemeTest = () => {
  const [isDark, setIsDark] = useState(getDomTheme() === 'dark');

  useEffect(() => {
    setIsDark(getDomTheme() === 'dark');
  }, []);

  const handleToggle = () => {
    const newTheme = toggleTheme();
    setIsDark(newTheme === 'dark');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        title={isDark ? 'Гэрэл горим' : 'Харанхуй горим'}
      >
        {isDark ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
      <div className="mt-2 text-xs text-secondary">
        {isDark ? 'Харанхуй' : 'Гэрэл'}
      </div>
    </div>
  );
};

export default ThemeTest; 