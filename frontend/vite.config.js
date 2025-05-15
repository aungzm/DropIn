import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // Load env variables based on the current mode (e.g., development or production)
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    plugins: [react()],
    server: {
      // Use the loaded environment variable, or default to 5173
      port: Number(env.VITE_FRONTEND_PORT) || 5173,
    },
  });
};