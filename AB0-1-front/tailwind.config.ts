import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'clay-sm': 'var(--clay-radius-sm)',
        'clay-md': 'var(--clay-radius-md)', 
        'clay-lg': 'var(--clay-radius-lg)',
        'clay-xl': 'var(--clay-radius-xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: {
            DEFAULT: '#2563EB',
            hover: '#1D4ED8',
            soft: '#EFF6FF',
          },
          green: {
            DEFAULT: '#10B981',
            dark: '#047857',
            soft: '#ECFDF5',
          },
          navy: '#0F172A',
          dark: '#020617',
          bg: '#F8FAFC',
          bgSoft: '#F1F5F9',
          border: '#CBD5E1',
          borderSoft: '#E5E7EB',
          muted: '#64748B',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        clay: {
          bg: 'hsl(var(--clay-bg))',
          surface: 'hsl(var(--clay-surface))',
          'surface-raised': 'hsl(var(--clay-surface-raised))',
          'surface-sunken': 'hsl(var(--clay-surface-sunken))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'clay-press': {
          '0%': { 
            transform: 'scale(1)',
          },
          '100%': { 
            transform: 'scale(0.98)',
          },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'clay-press': 'clay-press var(--clay-duration) var(--clay-easing)',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
