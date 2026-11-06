import { defineConfig, presetUno } from 'unocss'
import presetTypography from '@unocss/preset-typography'

export default defineConfig({
  presets: [presetUno({ dark: 'class' }), presetTypography()],
  theme: {
    colors: {
      brand: {
        50: '#eef2ff',
        // 다크 모드 글자용 밝은 단계 (indigo 계열). 없으면 dark:text-brand-200 등이 만들어지지 않아 기본(700)으로 남는다
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
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
