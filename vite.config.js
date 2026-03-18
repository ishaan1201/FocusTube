import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 🚀 Add this define block to polyfill process.env
  // This prevents 'process is not defined' errors from certain Supabase/SSR packages
  define: {
    'process.env': {}
  }
})
