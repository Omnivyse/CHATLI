/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#ffffff',
          dark: '#000000',
        },
        foreground: {
          DEFAULT: '#000000',
          dark: '#ffffff',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          dark: '#1a1a1a',
        },
        border: {
          DEFAULT: '#e5e5e5',
          dark: '#333333',
        },
        primary: {
          DEFAULT: '#000000',
          dark: '#ffffff',
        },
        secondary: {
          DEFAULT: '#666666',
          dark: '#999999',
        },
      },
      fontFamily: {
        mongolian: ['Noto Sans Mongolian', 'Arial', 'sans-serif'],
        sans: ['Inter', 'Noto Sans Mongolian', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 