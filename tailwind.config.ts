import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        panel: "#111A2E",
        line: "rgba(255, 255, 255, 0.06)",
        primary: "#3B82F6",
        teal: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#60A5FA",
          400: "#3B82F6",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#172554",
          950: "#101B3D"
        }
      },
      boxShadow: {
        glow: "0 8px 24px rgba(0, 0, 0, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
