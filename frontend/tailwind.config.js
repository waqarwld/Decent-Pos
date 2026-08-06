/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        'pos-bg': '#1a1a2e',
        'pos-surface': '#16213e',
        'pos-surface-light': '#1f305e',
        'pos-text': '#e0e0e0',
        'pos-text-muted': '#8892b0',
        'pos-accent': '#00d4ff',
        'pos-accent-hover': '#33ddff',
        'pos-danger': '#ff4757',
        'pos-success': '#2ed573',
        'pos-warning': '#ffa502',
        'admin-bg': '#f8fafc',
        'admin-surface': '#ffffff',
        'admin-sidebar': '#1e293b',
        'admin-text': '#334155',
        'admin-border': '#e2e8f0',
      },
    },
  },
  plugins: [],
}
