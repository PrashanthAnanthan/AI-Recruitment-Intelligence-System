/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#0A0A0F',
        surface: '#111118',
        panel: '#1A1A24',
        border: '#2A2A38',
        accent: '#6C63FF',
        'accent-glow': '#8B85FF',
        emerald: '#00D4AA',
        crimson: '#FF4D6D',
        amber: '#FFB347',
        muted: '#6B6B8A',
        light: '#E8E8F0',
      },
      boxShadow: {
        glow: '0 0 40px rgba(108, 99, 255, 0.15)',
        'glow-sm': '0 0 20px rgba(108, 99, 255, 0.1)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      }
    },
  },
  plugins: [],
}
