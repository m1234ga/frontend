/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'tech-dark-blue': '#0A213D',
        'tech-cyan': '#00CED1',
        'tech-cyan-light': '#40E0D0',
        'tech-white': '#FFFFFF',
        'tech-gray': '#1a2332',
        'tech-gray-light': '#2a3441',
      },
      animation: {
        'pulse-cyan': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00CED1' },
          '100%': { boxShadow: '0 0 20px #00CED1, 0 0 30px #00CED1' },
        }
      }
    },
  },
  plugins: [],
} 