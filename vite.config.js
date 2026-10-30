import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: 'src/frontend', envDir: '../..',
    // Development only; Docker serves the built assets through Nginx instead.
    server: { port: 5173, proxy: { '/api': `http://127.0.0.1:${env.APP_PORT || 3000}` } },
    build: { outDir: '../../dist', emptyOutDir: true }
  };
});
