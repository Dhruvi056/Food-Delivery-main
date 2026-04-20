/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // `class` strategy — ThemeContext toggles `dark` on <html>
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // BiteBlitz brand palette
        brand: {
          accent:   "#e94560",
          accentHover: "#c73652",
          dark:     "#0f0f0f",
          card:     "#1a1a2e",
          cardHover:"#16213e",
          border:   "#2a2a4a",
          muted:    "#94a3b8",
          light:    "#f8fafc",
          lightCard:"#ffffff",
          lightBorder:"#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":     "fadeIn 0.4s ease forwards",
        "slide-up":    "slideUp 0.4s ease forwards",
        "pulse-ring":  "pulseRing 1.8s ease-out infinite",
        "progress":    "progressFill 0.6s ease forwards",
        "shimmer":     "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeIn:   { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp:  { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        pulseRing:{ "0%":{ boxShadow:"0 0 0 0 rgba(233,69,96,0.5)" }, "70%":{ boxShadow:"0 0 0 12px rgba(233,69,96,0)" }, "100%":{ boxShadow:"0 0 0 0 rgba(233,69,96,0)" } },
        progressFill: { "0%": { width: "0%" }, "100%": { width: "100%" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        "glow-accent": "0 0 20px rgba(233,69,96,0.35)",
        "card-dark":   "0 4px 24px rgba(0,0,0,0.45)",
        "card-light":  "0 4px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
