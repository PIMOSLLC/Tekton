/** @type {import('tailwindcss').Config} */
// Mirrors the Phoenix Insight Nexus tailwind config (family consistency):
// same brand palette, midnight dark canvas, darkMode 'class', Inter/JetBrains Mono.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1e40af',
        'brand-secondary': '#3b82f6',
        'brand-light': '#dbeafe',
        'gray-dark': '#111827',
        'gray-medium': '#374151',
        'gray-light': '#9ca3af',
        'gray-750': '#2e4053',
        midnight: '#0b0f1a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};