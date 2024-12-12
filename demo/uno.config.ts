// import theme from 'daisyui/functions/variables.js';
import colors from 'daisyui/src/theming/index.js';
import { defineConfig, presetIcons, presetUno } from 'unocss';
import { presetDaisy } from '../src/index.js'; // '@ameinhardt/unocss-preset-daisy';

export default defineConfig({
  presets: [presetUno(), presetDaisy(), presetIcons()],
  theme: {
    // ...theme,
    colors
  }
});
