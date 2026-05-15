import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        buku: resolve(__dirname, 'buku.html'),
        mading: resolve(__dirname, 'mading.html'),
        admin: resolve(__dirname, 'admin.html'),
        visimisi: resolve(__dirname, 'visimisi.html'),
      },
    },
  },
});