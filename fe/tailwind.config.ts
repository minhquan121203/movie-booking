import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
const config: Config = {
  darkMode: 'class', // bắt buộc để next-themes hoạt động
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
    './src/lib/**/*.{ts,tsx,js,jsx}',
    './src/styles/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      /* ======================
         🎨 COLOR TOKENS (HSL/HEX)
         ====================== */
      colors: {
        /* Cốt lõi */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',

        /* Chủ đề */
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',

        /* Layout bổ sung */
        surface: 'var(--surface)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-default': 'var(--border-default)',
        'input-background': 'var(--input-background)',
        'switch-background': 'var(--switch-background)',

        /* Sidebar */
        sidebar: 'var(--sidebar)',
        'sidebar-foreground': 'var(--sidebar-foreground)',
        'sidebar-primary': 'var(--sidebar-primary)',
        'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
        'sidebar-accent': 'var(--sidebar-accent)',
        'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-ring': 'var(--sidebar-ring)',

        /* Chart */
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
      },

      /* ======================
         🧱 RADIUS & FONT
         ====================== */
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        poppins: ["'Poppins'", 'system-ui', 'sans-serif'],
      },

      /* ======================
         ⚙️ TRANSITION & EFFECTS
         ====================== */
      transitionProperty: {
        theme: 'background-color, color, border-color, fill, stroke',
      },
    },
  },
  plugins: [
    tailwindcssAnimate, // nếu bạn dùng shadcn/ui
  ],
}

export default config
