/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Map CSS custom property tokens as Tailwind utilities
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          overlay: "var(--bg-overlay)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        brand: {
          gold: "var(--brand-gold)",
          navy: "#001a4e",
          green: "#00a651",
          "green-d": "var(--brand-green-deep)",
          "green-l": "var(--brand-green-light)",
        },
        alert: {
          success: "var(--alert-success)",
          warning: "var(--alert-warning)",
          danger: "var(--alert-danger)",
          info: "var(--alert-info)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        glass: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
        low: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        high: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
