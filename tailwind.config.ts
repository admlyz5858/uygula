import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        universe: {
          bg: "#020617",
          card: "rgba(15, 23, 42, 0.45)",
          glow: "#60a5fa",
          accent: "#a78bfa",
          break: "#34d399"
        }
      },
      boxShadow: {
        glass: "0 20px 50px rgba(15, 23, 42, 0.35)"
      },
      animation: {
        drift: "drift 16s ease-in-out infinite",
        pulseSlow: "pulseSlow 3s ease-in-out infinite",
        zoomBg: "zoomBg 35s ease-in-out infinite alternate"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" }
        },
        pulseSlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.45" },
          "50%": { transform: "scale(1.08)", opacity: "0.9" }
        },
        zoomBg: {
          "0%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1.12)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
