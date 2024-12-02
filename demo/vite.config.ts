import process from 'node:process';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL ?? '/',
  plugins: [
    unocss()
  ]
});
