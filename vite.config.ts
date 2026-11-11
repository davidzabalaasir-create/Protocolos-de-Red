/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { prerenderLessons } from './scripts/prerender'

export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderLessons()],
  test: { include: ['src/**/*.test.ts'] },
})
