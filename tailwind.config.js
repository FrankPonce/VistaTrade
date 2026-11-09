/** @type {import('tailwindcss').Config} */
//
// VistaTrade "Miami Vice at night" palette.
// Black canvas, faintly purple glass panels, and two neon poles toned down
// a notch: teal (gains, buy) and pink (losses, sell). Purple is the brand glue.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        edge: 'rgb(var(--edge) / <alpha-value>)',
        text: '#F2EDF7',
        muted: '#9D94AA',
        faint: '#5E566B',
        vice: {
          pink: '#F0609E',
          teal: '#3CCFC6',
          purple: '#9B6BFF',
          sunset: '#F7A072',
        },
        up: '#3CCFC6',
        down: '#F0609E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        panel: '18px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 0 rgb(255 255 255 / 0.04), 0 0 0 1px rgb(var(--edge) / 0.22), 0 12px 40px -12px rgb(var(--edge) / 0.18)',
        glow: '0 0 24px -4px rgb(var(--edge) / 0.45)',
      },
    },
  },
  plugins: [],
};
