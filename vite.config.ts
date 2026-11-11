/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { prerenderLessons } from './scripts/prerender'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderLessons(), cloudflare()],
  test: { include: ['src/**/*.test.ts'] },
})