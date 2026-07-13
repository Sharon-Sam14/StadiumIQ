/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#080A0C",
          surface: "#101418",
          elevated: "#181E24",
        },
        brand: {
          green: {
            deep: "#0C3A2B",
            light: "#1E6B52",
          },
          gold: {
            DEFAULT: "#D4AF37",
            glow: "#F3E5AB",
          },
        },
        alert: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
        text: {
          primary: "#F0F4F8",
          secondary: "#9AA8B6",
          tertiary: "#627282",
        },
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glass: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
        low: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        high: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
    },
  },
  plugins: [],
}
