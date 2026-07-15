import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef4ff",
          100: "#d9e6fb",
          500: "#2455a6",
          700: "#16366e",
          900: "#071936"
        },
        gold: "#b9924a",
        ink: "#172033"
      },
      boxShadow: {
        soft: "0 16px 48px rgba(7, 25, 54, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

