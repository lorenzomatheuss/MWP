/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          gold: "#FFD700",
          "gold-light": "#FFED4A",
          "gold-dark": "#D4AF37",
          "deep-black": "#000000",
          "cosmic-black": "#0A0A0A",
          "ice-white": "#FFFFFF",
          "glass-white": "rgba(255, 255, 255, 0.1)",
          "neon-cyan": "#00FFFF",
          "neon-purple": "#8A2BE2",
          "neon-pink": "#FF69B4",
          "quantum-blue": "#0066FF",
        },
        backgroundImage: {
          'quantum-gradient': 'linear-gradient(135deg, #FFD700 0%, #00FFFF 25%, #8A2BE2 50%, #FF69B4 75%, #FFD700 100%)',
          'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          'holographic': 'linear-gradient(45deg, #FFD700, #00FFFF, #8A2BE2, #FF69B4)',
        },
        boxShadow: {
          'quantum': '0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.1)',
          'neon-cyan': '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF',
          'neon-purple': '0 0 10px #8A2BE2, 0 0 20px #8A2BE2, 0 0 30px #8A2BE2',
          'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        },
        backdropBlur: {
          'quantum': '20px',
        },
        fontFamily: {
          'display': ['Orbitron', 'monospace'],
          'heading': ['Orbitron', 'monospace'],
          'sans': ['Inter', 'system-ui', 'sans-serif'],
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "quantum-float": {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-5px, -10px) rotate(1deg)' },
          '50%': { transform: 'translate(10px, -5px) rotate(-1deg)' },
          '75%': { transform: 'translate(-10px, 5px) rotate(1deg)' },
        },
        "holographic-shimmer": {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        "neon-pulse": {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor'
          },
          '50%': { 
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
          },
        },
        "morphing-glow": {
          '0%': { 
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          },
          '50%': { 
            borderRadius: '24px',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)'
          },
          '100%': { 
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          },
        },
        "glitch": {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        "particle-drift": {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' },
        },
        "data-stream": {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "quantum-float": "quantum-float 20s ease-in-out infinite",
        "holographic-shimmer": "holographic-shimmer 3s linear infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite alternate",
        "morphing-glow": "morphing-glow 4s ease-in-out infinite",
        "glitch": "glitch 0.3s ease-in-out",
        "particle-drift": "particle-drift 10s linear infinite",
        "data-stream": "data-stream 3s linear infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-glow': {
          textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        },
        '.backdrop-blur-quantum': {
          backdropFilter: 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
        },
        '.transform-gpu': {
          transform: 'translateZ(0)',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          transformStyle: 'preserve-3d',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}