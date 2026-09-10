import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Ловит чтение переменной в её собственном инициализаторе — в рантайме это
      // ReferenceError по временной мёртвой зоне, а `tsc` внутри объектного литерала
      // такую самоссылку не видит. Так в v0.6.0 едва не уехал белый экран на сетевой
      // форме: `address: selectedClub.address || club.address` внутри `const club = ...`.
      // functions: false — объявления функций поднимаются, там предупреждать не о чем.
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    },
  },
])
