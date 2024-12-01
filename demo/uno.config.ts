import { defineConfig, presetIcons, presetUno } from 'unocss';
import { presetDaisy } from '../src/index.js'; // 'unocss-preset-daisy';

export default defineConfig({
  presets: [presetUno(), presetDaisy(), presetIcons()]
});
