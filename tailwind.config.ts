import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      colors: {
        brand: { 50: "#f1f3ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" },
        coral: { 400: "#ff8a78", 500: "#ff6b57", 600: "#ee5440" },
        sun: { 50: "#fff8e1", 400: "#ffd35c", 500: "#ffc83d" },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(30,27,75,.04), 0 8px 24px -8px rgba(30,27,75,.10)",
        lift: "0 2px 4px rgba(30,27,75,.05), 0 16px 32px -12px rgba(30,27,75,.18)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: { "fade-up": "fade-up .45s ease-out both", float: "float 6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
