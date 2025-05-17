/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js" // Añadido para Flowbite
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#e6f7f1',
          100: '#ccefe3',
          200: '#99dfc7',
          300: '#66cfab',
          400: '#33bf8f',
          500: '#00AF73', // Verde principal
          600: '#009c66',
          700: '#008959',
          800: '#00734c',
          900: '#005c3f',
        },
        'secondary': '#333333', // Gris oscuro para la barra lateral
        'dark': {
          100: '#cccccc',
          200: '#999999',
          300: '#666666',
          400: '#4d4d4d',
          500: '#333333', // Gris oscuro para textos y barras
          600: '#2e2e2e',
          700: '#292929',
          800: '#1f1f1f',
          900: '#1a1a1a',
        },
      },
      fontSize: {
        'xxs': '0.625rem',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
