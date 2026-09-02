/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crust: '#2B1B12',      // marrom carvao, base escura
        tomato: '#C1272D',     // vermelho molho de tomate - cor primaria
        tomatodark: '#921E23',
        cream: '#F7EFE1',      // creme mussarela - fundo claro
        gold: '#E8A33D',       // dourado da borda assada - acento
        basil: '#4A7C59',      // verde manjericao - acento secundario
        paper: '#FCF8F0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
