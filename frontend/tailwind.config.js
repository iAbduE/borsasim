/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Tema token'ları (main.css içindeki CSS değişkenlerinden gelir; koyu/açık otomatik)
        bg: 'var(--c-bg)',
        panel: 'var(--c-panel)',
        'panel-2': 'var(--c-panel-2)',
        elev: 'var(--c-elev)',
        line: 'var(--c-line)',
        'line-soft': 'var(--c-line-soft)',
        ink: 'var(--c-ink)',
        'ink-2': 'var(--c-ink-2)',
        'ink-3': 'var(--c-ink-3)',
        accent: 'var(--c-accent)',
        'accent-ink': 'var(--c-accent-ink)',
        'accent-bg': 'var(--c-accent-bg)',
        up: 'var(--c-up)',
        'up-bg': 'var(--c-up-bg)',
        down: 'var(--c-down)',
        'down-bg': 'var(--c-down-bg)',
        warn: 'var(--c-warn)',
        'warn-bg': 'var(--c-warn-bg)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"JetBrains Mono"', '"Cascadia Code"', '"Roboto Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        label: '0.14em',
      },
      borderRadius: {
        DEFAULT: '7px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,.20)',
        pop: '0 8px 30px rgba(0,0,0,.35)',
      },
      animation: {
        'marquee': 'marquee 42s linear infinite',
        'fade-in': 'fadeIn .25s ease-out',
        'flash-up': 'flashUp .6s ease-out',
        'flash-down': 'flashDown .6s ease-out',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        flashUp: {
          '0%,100%': { backgroundColor: 'transparent' },
          '40%': { backgroundColor: 'var(--c-up-bg)' },
        },
        flashDown: {
          '0%,100%': { backgroundColor: 'transparent' },
          '40%': { backgroundColor: 'var(--c-down-bg)' },
        },
      },
    },
  },
  plugins: [],
}
