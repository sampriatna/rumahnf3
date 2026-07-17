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
        surface: "#f5f8fb",
        navy: {
          50: "#f2f6fb",
          100: "#dfeaf5",
          400: "#2d6a9f",
          500: "#214f7c",
          600: "#1a3f66",
          700: "#12365c",
          800: "#0b2745",
          900: "#071b31",
          950: "#040f1c"
        },
        gold: {
          100: "#fbf3df",
          400: "#d9af4a",
          500: "#c99a2e",
          600: "#a7781f"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(7, 27, 49, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
