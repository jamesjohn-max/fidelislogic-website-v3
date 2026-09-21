/** @type {import('tailwindcss').Config} */
module.exports = {
    // Only apply hover: styles on devices that can actually hover, so card
    // lifts and colour shifts don't stick after a tap on touch screens.
    future: {
        hoverOnlyWhenSupported: true,
    },
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                // Clean design system foundations.
                // `display` is the single knob for the heading face.
                fontFamily: {
                    sans: ['Roboto', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                    display: ['Poppins', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                },
                // Clean type scale is 12/14/16/20/24/32. Tailwind ships 3xl=30 and 4xl=36,
                // which are off-scale, so the two steps the section headings use are
                // redefined here. That lands all ~67 headings on 24/32 without editing them.
                // `lg` (18px) is deliberately kept: a 20px lede beside a 20px `xl` heading
                // would flatten the hierarchy the scale is meant to create.
                fontSize: {
                    '3xl': ['1.5rem', { lineHeight: '2rem' }],
                    '4xl': ['2rem', { lineHeight: '2.5rem' }],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        'fidelis-cyan': '#22D3EE',
                        'fidelis-blue': '#2563EB',
                        'fidelis-dark-blue': '#1E40AF',
                        'brand-dark': '#0B1220'
                },
                // Strong ease-out for UI motion (entrances, hovers, press
                // feedback). The built-in ease-out is too soft to feel responsive.
                transitionTimingFunction: {
                        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)'
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out'
                }
        }
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};