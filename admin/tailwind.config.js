/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          accent:       "#e94560",
          accentHover:  "#c73652",
          dark:         "#0a0a0f",
          card:         "#13131f",
          cardHover:    "#1a1a2e",
          border:       "#252540",
          muted:        "#94a3b8",
          light:        "#f8fafc",
          lightCard:    "#ffffff",
          lightBorder:  "#e2e8f0",
          sidebar:      "#0e0e1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease forwards",
        "slide-in":   "slideIn 0.3s ease forwards",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "shimmer":    "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideIn:   { "0%": { opacity: 0, transform: "translateX(-10px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(233,69,96,0.4)" }, "70%": { boxShadow: "0 0 0 10px rgba(233,69,96,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(233,69,96,0)" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      boxShadow: {
        "glow-accent": "0 0 16px rgba(233,69,96,0.4)",
        "card-dark":   "0 4px 24px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
