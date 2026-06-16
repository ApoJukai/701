import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset paths work well for GitHub Pages project sites:
// https://ApoJukai.github.io/701/
export default defineConfig({
  plugins: [react()],
  base: '/701/',
})
