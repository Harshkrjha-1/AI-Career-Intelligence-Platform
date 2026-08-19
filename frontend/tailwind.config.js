/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B111E",
        glassBg: "rgba(15, 23, 42, 0.65)",
        glassBorder: "rgba(255, 255, 255, 0.07)",
        neonPurple: "#a855f7",
        neonCyan: "#22d3ee",
        neonIndigo: "#6366f1",
        neonGreen: "#10b981",
        neonPink: "#f43f5e",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
