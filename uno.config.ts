import transformerDirectives from '@unocss/transformer-directives';
import { defineConfig, presetIcons, presetUno } from 'unocss';
import { presetDaisy } from './src/index.js';

export default defineConfig({
  presets: [presetUno(), presetDaisy(), presetIcons()],
  transformers: [transformerDirectives()]
});
