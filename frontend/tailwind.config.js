export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body:    ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      colors: {
        green: { DEFAULT:'#1E4D2B', mid:'#2D6A4F', lt:'#52B788', pale:'#D1FAE5' },
        gold:  { DEFAULT:'#D4A017', lt:'#F2CC6B', pale:'#FEF3C7' },
        ink:   { DEFAULT:'#141A10', soft:'#374151', muted:'#6B7280' },
        bg:    { DEFAULT:'#F5F3EE', surface:'#FFFFFF', border:'#E4E0D8' },
      },
      borderRadius: { xl:'12px', '2xl':'16px', '3xl':'20px', '4xl':'28px' },
    },
  },
  plugins: [],
}
