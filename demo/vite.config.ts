import type { UserConfig } from 'vite';
import process from 'node:process';
import unocss from 'unocss/vite';
import pkgJson from '../package.json' with { type: 'json' };

const { version } = pkgJson as { version: string };
process.env.VITE_VERSION = version;

export default {
  base: process.env.BASE_URL ?? '/',
  plugins: [
    unocss()
  ]
} as UserConfig;
