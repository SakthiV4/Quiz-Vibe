/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Prodmast / EcoTech Palette
                bg: {
                    primary: '#142F32',    // Deep Green
                    secondary: '#0A1C1F',  // Darker Green
                    tertiary: '#1F4045',   // Card Green
                    hover: '#2A4A50',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#9BA8C1',
                    tertiary: '#5A6B8C',
                },
                accent: {
                    primary: '#E3FFCC',    // Lime Green
                    secondary: '#FFFFFF',  // White
                    tertiary: '#142F32',   // Dark Green for buttons
                },
                success: '#E3FFCC',
                error: '#FF6B6B',
                warning: '#FFD93D',
                info: '#6B9DFF',
                'glass-border': 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                display: ['Manrope', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #142F32 0%, #0A1C1F 100%)',
                'gradient-card': 'linear-gradient(180deg, rgba(31, 64, 69, 0.7) 0%, rgba(20, 47, 50, 0.7) 100%)',
            },
            animation: {
                fadeSlideIn: 'fadeSlideIn 0.3s ease-out',
                pulseGlow: 'pulseGlow 2s ease infinite',
            },
            keyframes: {
                fadeSlideIn: {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(227, 255, 204, 0.4)' },
                    '50%': { boxShadow: '0 0 20px 8px rgba(227, 255, 204, 0.1)' },
                },
            }
        },
    },
    plugins: [],
}
