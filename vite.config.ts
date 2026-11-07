import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminhos relativos: a demo roda na raiz (Vercel) ou em subpasta sem configurar o domínio.
  base: './',
  plugins: [react()],
  // Os testes de domínio do app móvel rodam aqui, mas o tsconfig dele estende
  // `expo/tsconfig.base`, que só existe com as dependências de apps/mobile instaladas (o CI não
  // instala). Fixar o tsconfig da raiz evita que o transform procure o do Expo.
  tsconfig: 'tsconfig.json',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'apps/mobile/src/**/*.test.ts'],
    restoreMocks: true,
  },
});
