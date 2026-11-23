import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    // The React app calls "/cloud/..." and Vite forwards it to the Express API,
    // so there are no CORS problems during development.
    const proxy = {
        '/cloud': {
            target: env.VITE_PROXY_TARGET || 'http://localhost:5001',
            changeOrigin: true,
        },
    }

    return {
        plugins: [react(), tailwindcss()],
        server: { port: 5173, proxy },
        preview: { port: 4173, proxy },
    }
})
