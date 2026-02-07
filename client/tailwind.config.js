// =============================================================================
// client/tailwind.config.js — Tailwind CSS Configuration
// =============================================================================
//
// Tailwind is our utility-first CSS framework. It generates only the CSS
// classes that are actually used in our JSX files, keeping the bundle tiny.
//
// =============================================================================

/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // Custom color palette for the drive-thru UI
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',   // Primary orange — warm, inviting, food-related
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },

      // Custom animation for the pulsing mic button
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '0.5' },
          '80%':  { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
    },
  },

  plugins: [],
};
