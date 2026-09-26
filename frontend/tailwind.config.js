/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // StockSense Clean White + Minimal Blue Theme
        surface: {
          bg: '#F8FAFC',        // Slate 50 - Main background
          card: '#FFFFFF',      // Pure white - Primary cards / panels
          cream: '#FFFFFF',
          secondary: '#F1F5F9', // Slate 100 - Secondary surface / zebra rows
          hover: '#F1F5F9',     // Hover state
          active: '#E2E8F0',    // Pressed state
        },
        border: {
          DEFAULT: '#E2E8F0',   // Slate 200 - Standard border
          strong: '#CBD5E1',    // Slate 300 - Emphasized border
          light: '#F1F5F9',     // Slate 100 - Subtle divider
          subtle: '#E2E8F0',
          blue: '#BFDBFE',      // Blue 200 - Blue accent border
        },
        text: {
          primary: '#1E293B',   // Slate 800 - Dominant headings and body
          secondary: '#475569', // Slate 600 - Secondary text
          muted: '#64748B',     // Slate 500 - Metadata & captions
          subtle: '#94A3B8',    // Slate 400 - Placeholders
          disabled: '#CBD5E1',  // Slate 300
          white: '#FFFFFF',
          blue: '#2563EB',      // Blue 600 - Links & highlights
        },
        brand: {
          DEFAULT: '#2563EB',   // Primary Blue
          dark: '#1D4ED8',      // Dark Blue (hover)
          light: '#3B82F6',
          soft: '#EFF6FF',      // Soft Blue (background highlights)
          border: '#BFDBFE',    // Blue border
        },
        accent: {
          DEFAULT: '#2563EB',   // Blue 600
          hover: '#1D4ED8',
          soft: '#EFF6FF',
          border: '#BFDBFE',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          'success-border': '#BBF7D0',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          'warning-border': '#FDE68A',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          'danger-border': '#FECACA',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },

        // Legacy compatibility mappings
        archive: {
          950: '#0F172A',
          900: '#1E293B',
          850: '#334155',
          800: '#475569',
          750: '#64748B',
          700: '#94A3B8',
          600: '#CBD5E1',
          500: '#E2E8F0',
          muted: '#64748B',
          dim: '#475569',
        },
        ivory: {
          50: '#FFFFFF',
          100: '#1E293B',
          200: '#475569',
          300: '#64748B',
          400: '#94A3B8',
        },
        gold: {
          300: '#DBEAFE',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        signal: {
          orange: '#D97706',
          green: '#16A34A',
          red: '#DC2626',
          blue: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'modal': '0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.375rem' }],
      },
    },
  },
  plugins: [],
}
