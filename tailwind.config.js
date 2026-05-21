/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pine: "#1B5E20",
        moss: "#2E7D32",
        mint: "#A5D6A7",
        fog: "#F5F8F5",
        ink: "#0F172A",
        amber: "#F59E0B",
        rose: "#BE123C"
      }
    },
  },
  plugins: [],
}

