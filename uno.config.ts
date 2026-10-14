import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno({ dark: 'class' })],
  theme: {
    colors: {
      brand: {
        50: '#eef2ff',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
      },
    },
  },
  shortcuts: {
    btn: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors',
    'nav-link':
      'text-neutral-700 hover:text-brand-600 dark:text-neutral-200 dark:hover:text-brand-500 font-medium no-underline',
  },
})
