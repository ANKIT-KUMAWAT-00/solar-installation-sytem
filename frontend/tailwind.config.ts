import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        solar: {
          darkest: "#070B14",
          dark: "#0B1120",
          card: "#0F172A",
          surface: "#1E293B",
          border: "#334155",
          muted: "#94A3B8",
          gold: "#F59E0B",
          amber: "#D97706",
          yellow: "#EAB308",
          emerald: "#10B981",
          green: "#059669",
          cyan: "#06B6D4",
          blue: "#3B82F6",
        },
      },
      backgroundImage: {
        'solar-radial': 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
        'solar-glow': 'radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.12) 0%, transparent 50%)',
        'solar-cell-pattern': 'linear-gradient(rgba(30, 41, 59, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.4) 1px, transparent 1px)',
      },
      boxShadow: {
        'solar-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'solar-gold': '0 0 20px -3px rgba(245, 158, 11, 0.25)',
        'solar-card': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit-slow': 'orbit 20s linear infinite',
      }
    },
  },
  plugins: [],
};
export default config;
