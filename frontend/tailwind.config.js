/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1E5AA8",
          foreground: "#FFFFFF",
          light: "#2D7ACC",
          dark: "#154280",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          blue: "#1E5AA8",
          cyan: "#1B9ED9",
          orange: "#FF9933",
          yellow: "#FFB900",
          magenta: "#C1186C",
          accent: "#1B9ED9",
          hover: "#1E5AA8",
        },
        success: "#16A34A",
        warning: "#FFB900",
        error: "#DC2626",
        info: "#1B9ED9",
        score: {
          high: { bg: "#DCFCE7", text: "#15803D", bar: "#16A34A" },
          moderate: { bg: "#FFF7E6", text: "#B45309", bar: "#FFB900" },
          low: { bg: "#FFE4D6", text: "#C1186C", bar: "#FF9933" },
          none: { bg: "#FEE2E2", text: "#991B1B", bar: "#DC2626" },
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Public Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};