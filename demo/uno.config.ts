import type { Theme } from 'unocss/preset-mini';
import theme from 'daisyui/functions/variables.js';
// import colors from 'daisyui/src/theming/index.js';
import { defineConfig, presetIcons, presetUno } from 'unocss';
import { presetDaisy } from '../src/index.js'; // '@ameinhardt/unocss-preset-daisy';

const { rules, ...preset } = presetUno();

export default defineConfig({
  presets: [presetDaisy(), {
    ...preset,
    rules: rules!.filter(([selector]) => !['/^tab(?:-(.+))?$/', 'table'].includes(selector.toString()))
  }, presetIcons()],
  separators: [':'],
  theme: {
    ...theme as Theme
    // colors: colors as Record<string, string>
  }
});
