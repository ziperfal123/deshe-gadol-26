import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset + data paths relative so the static build works
// under a GitHub Pages project subpath.
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
