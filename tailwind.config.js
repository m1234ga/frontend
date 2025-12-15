/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'soft-bg': {
          DEFAULT: '#f8fafc', // Slate 50
          dark: '#0f172a',    // Slate 900
        },
        'soft-surface': {
          DEFAULT: '#ffffff',
          dark: '#1e293b',    // Slate 800
        },
        'soft-primary': {
          DEFAULT: '#10b981', // Emerald 500
          light: '#34d399',
          dark: '#059669',
        },
        'soft-secondary': {
          DEFAULT: '#8b5cf6', // Violet 500
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        // Keeping tech colors as legacy mapping if needed, or deprecating them
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(0,0,0,0.05)',
        'soft-md': '0 8px 24px -6px rgba(0,0,0,0.08)',
        'soft-lg': '0 16px 48px -12px rgba(0,0,0,0.12)',
        'soft-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}