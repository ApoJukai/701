import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset paths work well for GitHub Pages project sites:
// https://USERNAME.github.io/REPOSITORY-NAME/
export default defineConfig({
  plugins: [react()],
  base: './',
})
