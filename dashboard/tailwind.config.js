/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: v("paper"), surface: v("surface"), sunken: v("sunken"),
        line: v("line"), ink: v("ink"), ink2: v("ink2"), ink3: v("ink3"),
        teal: v("teal"), tealsoft: v("tealsoft"), tealink: v("tealink"),
        empty: v("empty"), emptysoft: v("emptysoft"),
        low: v("low"), lowsoft: v("lowsoft"),
        ok: v("ok"), oksoft: v("oksoft"),
        fast: v("fast"), fastsoft: v("fastsoft"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        cam: ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgb(var(--shadow) / 0.04), 0 1px 3px rgb(var(--shadow) / 0.05)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 12px 28px -12px rgb(var(--shadow) / 0.18)",
        drawer: "-24px 0 60px -20px rgb(var(--shadow) / 0.3)",
      },
    },
  },
  plugins: [],
};
