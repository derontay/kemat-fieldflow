import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f5",
          100: "#d6f0e5",
          200: "#b0e0cb",
          300: "#7fcaac",
          400: "#46aa85",
          500: "#248f6a",
          600: "#177257",
          700: "#145b47",
          800: "#124839",
          900: "#103c30",
        },
        sand: "#f5f0e8",
        ink: "#12211c",
      },
      boxShadow: {
        panel: "0 18px 50px -22px rgba(18, 33, 28, 0.24)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(18,33,28,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(18,33,28,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
