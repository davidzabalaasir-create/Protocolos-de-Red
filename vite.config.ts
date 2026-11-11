/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { prerenderLessons } from './scripts/prerender'

export default defineConfig({
  // NEXT_PUBLIC_ too: that's the prefix Vercel's Clerk integration uses for the (public) publishable key
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), tailwindcss(), prerenderLessons()],
  test: { include: ['src/**/*.test.ts'] },
})
