import type { Config } from "tailwindcss"

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",

    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-geist-mono)", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [],
}

export default config