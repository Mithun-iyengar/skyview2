import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiGatewayPort = process.env.API_GATEWAY_PORT || '8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/v1/auth': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/admin/auth': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/v1/admin/auth': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/wallet': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/v1/wallet': {
        target: 'http://localhost:8086',
        changeOrigin: true
      },
      '/api/v1/flights': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/flights', '/flights')
      },
      '/api/v1/bookings': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/bookings', '/bookings')
      },
      '/api/v1/payments': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/payments', '/payments')
      },
      '/api/v1/notifications': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/notifications', '/notifications')
      },
      '/api': {
        target: `http://localhost:${apiGatewayPort}`,
        changeOrigin: true
      }
    }
  }
})
