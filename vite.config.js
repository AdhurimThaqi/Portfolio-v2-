import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Multi-page build: the public site (index.html) and the private admin
// panel (admin.html) are bundled separately so admin code never ships to
// visitors. Input paths are resolved relative to the project root by Vite.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
