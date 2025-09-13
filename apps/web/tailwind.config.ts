import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        line: {
          DEFAULT: "hsl(var(--border-default) / <alpha-value>)",
          strong: "hsl(var(--border-strong) / <alpha-value>)",
          stronger: "hsl(var(--border-stronger) / <alpha-value>)",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        alternative: {
          DEFAULT: "hsl(var(--background-alternative-default))",
          200: "hsl(var(--background-alternative-200))",
        },
        selection: {
          DEFAULT: "hsl(var(--background-selection))",
        },

        /* Sidebar (nuevo en shadcn) */
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Opcional: utilidades directas de brand */
        brand: {
          DEFAULT: "hsl(var(--brand-default))",
          600: "hsl(var(--brand-600))",
          500: "hsl(var(--brand-500))",
          400: "hsl(var(--brand-400))",
          300: "hsl(var(--brand-300))",
          200: "hsl(var(--brand-200))",
          1: "hsl(var(--colors-brand1))",
          2: "hsl(var(--colors-brand2))",
          3: "hsl(var(--colors-brand3))",
          4: "hsl(var(--colors-brand4))",
          5: "hsl(var(--colors-brand5))",
          6: "hsl(var(--colors-brand6))",
          7: "hsl(var(--colors-brand7))",
          8: "hsl(var(--colors-brand8))",
          9: "hsl(var(--colors-brand9))",
          10: "hsl(var(--colors-brand10))",
          11: "hsl(var(--colors-brand11))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 2px)",
        "2xl": "calc(var(--radius) + 6px)",
      },
    },
  },
  plugins: [animate],
  // plugins: [require("tailwindcss-animate")],
} satisfies Config;
