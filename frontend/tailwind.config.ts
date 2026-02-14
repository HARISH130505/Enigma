import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-black': '#0a0a0f',
                'cyber-dark': '#0d1117',
                'cyber-darker': '#161b22',
                'cyber-cyan': '#00ffff',
                'cyber-green': '#00ff88',
                'cyber-blue': '#0088ff',
                'cyber-pink': '#ff00ff',
                'cyber-red': '#ff3366',
                'cyber-orange': '#ffaa00',
                'cyber-text': '#e6edf3',
                'cyber-muted': '#7d8590',
                'cyber-border': '#30363d',
            },
            fontFamily: {
                'orbitron': ['Orbitron', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
                'space': ['Space Grotesk', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
} satisfies Config;
