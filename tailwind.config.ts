import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#0a0c14',
          secondary: '#0f1119',
          elevated: '#151822',
          hover: '#1a1e2e',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#60a5fa',
          muted: 'rgba(59, 130, 246, 0.12)',
        },
        muted: {
          foreground: '#a1a1aa',
          subtle: '#52525b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    typography
  ],
} satisfies Config;
