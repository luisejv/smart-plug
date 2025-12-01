/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "uber-black": "#000000",
        "uber-gray": "#1F1F1F",
        "uber-light-gray": "#F5F5F5",
        "uber-blue": "#0066FF",
      },
    },
  },
  plugins: [],
};
