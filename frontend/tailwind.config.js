/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#090D16',
          subtle: '#0D1424',
        },
        card: {
          DEFAULT: '#111A2E',
          subtle: '#17233D',
          hover: '#1D2C4D',
        },
        border: {
          subtle: '#1E2C4A',
          strong: '#2A3C63',
          focus: '#3B82F6',
        },
        signal: {
          red: '#EF4444',
          'red-bg': 'rgba(239, 68, 68, 0.12)',
          'red-border': 'rgba(239, 68, 68, 0.35)',
          teal: '#10B981',
          'teal-bg': 'rgba(16, 185, 129, 0.12)',
          'teal-border': 'rgba(16, 185, 129, 0.35)',
          amber: '#F59E0B',
          'amber-bg': 'rgba(245, 158, 11, 0.12)',
          'amber-border': 'rgba(245, 158, 11, 0.35)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
