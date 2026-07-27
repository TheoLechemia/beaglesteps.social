import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_APP_DOMAIN may carry a path segment (e.g. GitHub Pages project
  // pages: "theolechemia.github.io/beaglesteps.social") when the app isn't
  // served from the root of its domain.
  const [, ...pathParts] = env.VITE_APP_DOMAIN.split('/')
  const base = pathParts.length ? `/${pathParts.join('/')}/` : '/'

  return {
    base,
    plugins: [react(), tailwindcss()],
  }
})
