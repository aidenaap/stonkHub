/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/public/**/*.{html,js}",
    "./frontend/src/**/*.{html,js}"
  ],
  safelist: [
    'text-3xl', 'text-5xl', 'text-lg', 'text-xs', 'text-sm',
    'mb-2', 'mb-3', 'mb-4', 'mb-6',
    'mt-2', 'mt-3', 'mt-4', 'mt-6',
    'gap-3', 'gap-4', 'gap-6',
    'max-h-60', 'min-w-[300px]',
    'space-y-2', 'space-y-3', 'space-y-4',
    'grid', 'grid-cols-2',
    'leading-relaxed', 'whitespace-pre-line',
    'prose', 'prose-invert'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}