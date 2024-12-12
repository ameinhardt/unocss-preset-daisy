import type { UserConfig } from 'vite';
import process from 'node:process';
import unocss from 'unocss/vite';
import { version } from '../package.json';

process.env.VITE_VERSION = version;

export default {
  base: process.env.BASE_URL ?? '/',
  plugins: [
    unocss()
  ]
} as UserConfig;
