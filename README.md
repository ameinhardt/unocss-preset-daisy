# @ameinhardt/unocss-preset-daisy

> [UnoCSS](https://github.com/unocss/unocss) preset for [daisyUI](https://github.com/saadeghi/daisyui)

This daisyui preset directly uses the styles from your daisyui v4 version without pregeneration, supporting variants.

[Demo here](https://ameinhardt.github.io/unocss-preset-daisy/)

## 🚀 Installation

```sh
npm install unocss daisyui @ameinhardt/unocss-preset-daisy
```

## 📱 Usage
### 📋 Notes
* **pseudo classes** \
  unocss preset-mini uses e.g. "file" as pseudo-class variant to style the button of file inputs while assuming ":" and "-" [as variant seperator](https://unocss.dev/config/#separators). to avoid conflicts with e.g. `file-input`, limit the sperator in your unocss config to ":" only:
  ```
  ...
    separators: [':']
  ...
  ```
* **Reset css** \
  `@unocss/reset` comes with `unocss`. If you are using pnpm, install it separately unless you enable hoisting.
* **Theme colors** \
  In daisyUI v4, for including theme colors, use
  ```js
  import colors from 'daisyui/src/theming/index.js';
  ...
    theme: {
      colors
    }
  ```
  In daisyUI v5, for including theme colors, use
  ```js
  import theme from 'daisyui/functions/variables.js';
  ...
    theme: {
      ...theme
    }

  ```
* **Development styles** \
  If dev environment with `virtual:unocss-devtools` overlays css rule priority, use `safelist` to make sure the effected classes are generated. See [Edit classes in DevTools](https://unocss.dev/integrations/vite#edit-classes-in-devtools).

### Vite

```js
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy';
import { presetUno } from 'unocss';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    unocss({
      presets: [presetUno(), presetDaisy()]
    })
  ]
});
```

```js
import '@unocss/reset/tailwind.css';
import 'uno.css';
```

### Astro

```js
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy';
import { defineConfig } from 'astro/config';
import { presetUno } from 'unocss';
import unocss from 'unocss/astro';

export default defineConfig({
  integrations: [
    unocss({
      injectReset: true,
      presets: [presetUno(), presetDaisy()]
    })
  ]
});
```

### Nuxt

To use UnoCSS with Nuxt, `@unocss/nuxt` must be installed as well.

```js
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy';
import { defineNuxtConfig } from 'nuxt/config';
import { presetUno } from 'unocss';

export default defineNuxtConfig({
  css: ['@unocss/reset/tailwind.css'],
  modules: ['@unocss/nuxt'],
  unocss: {
    presets: [presetUno(), presetDaisy()]
  }
});
```

## 🛠️ Config

This preset accepts [the same config as daisyUI](https://daisyui.com/docs/config/) (except for `logs` and `prefix`).

```js
{
  presets: [
    presetUno(),
    presetDaisy({
      styled: false,
      themes: ['light', 'dark']
    })
  ];
}
```

## ⚠️ Limitations

* **This is not a full daisyUI port.** \
  All daisyUI components/utilities should work but they may not work with some UnoCSS features.
* **Some unused styles may be imported.** \
  This is both due to lots of hacks being used and how UnoCSS works. However, the preset will try to figure out the minimum styles needed, thus the cost is trivial most of the time.
