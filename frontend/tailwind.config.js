/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b9cdff",
          500: "#3b6dff",
          600: "#2a55e0",
          700: "#1f42b8",
          900: "#0e1e57",
        },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { soft: "0 10px 30px -10px rgba(31,66,184,.25)" },
    },
  },
  plugins: [],
};
