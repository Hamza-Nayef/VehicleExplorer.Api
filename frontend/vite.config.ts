import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In dev the UI runs on :5173 and the API on :5080; proxying keeps the frontend code
    // identical to production, where both are served from one origin.
    proxy: { '/api': 'http://localhost:5080' },
  },
  test: { environment: 'node' },
});
