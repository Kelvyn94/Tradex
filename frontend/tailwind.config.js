/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0d1117",
          800: "#212529",
          700: "#343a40",
          600: "#495057",
          500: "#6c757d",
          400: "#adb5bd",
          300: "#ced4da",
          200: "#dee2e6",
          100: "#e9ecef",
          50: "#f8f9fa",
        },
        success: "#00e676",
        danger: "#ff3d57",
        warning: "#ffd740",
        accent: "#00d4ff",
      },
      fontFamily: {
        mono: ["Share Tech Mono", "monospace"],
        body: ["Barlow", "sans-serif"],
        cond: ["Barlow Condensed", "sans-serif"],
      },
    },
  },
  plugins: [],
};
