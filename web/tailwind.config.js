/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                jungle: {
                    50: '#eafbef',
                    100: '#d4f7df',
                    200: '#aaeebe',
                    300: '#7fe69e',
                    400: '#55dd7e',
                    500: '#2ad55d',
                    600: '#22aa4b',
                    700: '#198038',
                    800: '#115525',
                    900: '#082b13',
                    950: '#061e0d',
                }
            }
        },
    },
    plugins: [],
}
