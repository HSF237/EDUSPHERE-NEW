import type { Config } from "tailwindcss";
const config: Config = {
  // Dark mode exists for the messaging screen only: it switches on under an element with the "chat-dark" class.
  darkMode: ["selector", ".chat-dark"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      colors: {
        brand: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--brand-${n}) / <alpha-value>)`])),
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
