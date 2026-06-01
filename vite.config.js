import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
  build: {
    target: 'es2020',
  },
};
