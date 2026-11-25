/** @type {import('tailwindcss').Config} */
// SayItRight design system tokens (shadcn-style): one soft violet-lavender
// palette, one type scale, one radius and shadow scale, used by every
// component. Chat-app feel: white bubbles on a lavender wash, big friendly
// corners, Nunito display type with Inter body text.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f4f1ff',
        foreground: '#2b2340',
        card: '#ffffff',
        muted: '#ece7fb',
        'muted-foreground': '#7a7194',
        border: '#e3dcf7',
        'border-strong': '#cfc3ef',
        primary: '#7c5cff',
        'primary-hover': '#6a45f5',
        'primary-soft': '#efeaff',
        accent: '#ffb020',
        'accent-soft': '#fff4dd',
        success: '#1d9e75',
        'success-soft': '#e3f7ef',
        'success-border': '#b7e8d5',
        danger: '#e5484d',
        'danger-soft': '#fdecec',
        'danger-border': '#f5c2c4',
      },
      fontFamily: {
        display: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        control: '14px',
        bubble: '22px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(43,35,64,0.05), 0 2px 6px rgba(43,35,64,0.05)',
        md: '0 6px 18px rgba(124,92,255,0.10), 0 2px 6px rgba(43,35,64,0.06)',
        lg: '0 16px 40px rgba(124,92,255,0.16), 0 6px 14px rgba(43,35,64,0.08)',
        bubble: '0 3px 10px rgba(43,35,64,0.07)',
      },
    },
  },
  plugins: [],
}
