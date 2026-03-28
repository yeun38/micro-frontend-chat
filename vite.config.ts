import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    appType: 'mpa',
    plugins: [
      react(),
      federation({
        name: 'chat',
        filename: 'remoteEntry.js',
        exposes: {
          './BookRecommendation': './src/BookRecommendation',
        },
        remotes: {
          mfeHost: `${env.VITE_MFE_HOST_URL || 'https://dusunax-001.web.app'}/assets/remoteEntry.js`,
          auth: `${env.VITE_AUTH_URL || 'https://auth-dusunax-001.web.app'}/assets/remoteEntry.js`,
        },
        shared: ['react', 'react-dom'],
      }),
    ],
    build: {
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
    },
    preview: {
      port: 3011,
      strictPort: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  }
})
