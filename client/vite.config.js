import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api calls are proxied to the Express server so you don't need CORS or extra config.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
