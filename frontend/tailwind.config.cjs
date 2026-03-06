/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#ef4444", // Red dominant
        "primary-dark": "#dc2626",
        "bg-light": "#F0F2F5",
        "bg-dark": "#1A1A2E", // Dark blueish background
        "text-main": "#1C1C1E",
        "text-sub": "#6E6E73",
        "glass-light": "rgba(255, 255, 255, 0.25)",
        "glass-dark": "rgba(26, 26, 46, 0.5)",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xl': '20px',
      }
    },
  },
  plugins: [],
};
