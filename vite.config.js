import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src/frontend', envDir: '../..',
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3000' } },
  build: { outDir: '../../dist', emptyOutDir: true }
});
