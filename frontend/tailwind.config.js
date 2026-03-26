export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body:    ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'rgba(var(--bg), <alpha-value>)',
        surface: 'rgba(var(--surface), <alpha-value>)',
        'hero-bg': 'rgba(var(--hero-bg), <alpha-value>)',
        dark: 'rgba(var(--dark), <alpha-value>)',
        primary: {
          DEFAULT: 'rgba(var(--primary), <alpha-value>)',
          lt: 'rgba(var(--primary-lt), <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgba(var(--accent), <alpha-value>)',
          lt: 'rgba(var(--accent-lt), <alpha-value>)',
        },
        muted: 'rgba(var(--muted), <alpha-value>)',
        border: 'rgba(var(--border), <alpha-value>)',
        glass: 'rgba(var(--glass), <alpha-value>)',
        'glass-border': 'rgba(var(--glass-border), <alpha-value>)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
}
