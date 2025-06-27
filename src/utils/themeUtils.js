// Theme management utilities
export const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
};

// Get system theme preference
export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default to dark mode
};

// Get stored theme from localStorage
export const getStoredTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || 'dark';
  }
  return 'dark';
};

// Get current DOM theme
export const getDomTheme = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'dark';
};

// Set theme in localStorage and apply to document
export const setTheme = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Initialize theme on app load
export const initializeTheme = () => {
  const theme = getStoredTheme();
  setTheme(theme);
};

// Toggle between light and dark themes
export const toggleTheme = () => {
  const currentTheme = getDomTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}; 