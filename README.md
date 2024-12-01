# unocss-preset-daisy

> [UnoCSS](https://github.com/unocss/unocss) preset for [daisyUI](https://github.com/saadeghi/daisyui)

[Checkout the demo!](https://unocss-preset-daisy.vercel.app/)

## Installation

```sh
npm install unocss daisyui unocss-preset-daisy
```

## Usage

> **Note**: `@unocss/reset` comes with `unocss`. If you are using pnpm, install it separately unless you enable hoisting.

### Vite

```js
import { presetUno } from 'unocss';
import { presetDaisy } from 'unocss-preset-daisy';
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
import { defineConfig } from 'astro/config';
import { presetUno } from 'unocss';
import { presetDaisy } from 'unocss-preset-daisy';
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
import { defineNuxtConfig } from 'nuxt/config';
import { presetUno } from 'unocss';
import { presetDaisy } from 'unocss-preset-daisy';

export default defineNuxtConfig({
  css: ['@unocss/reset/tailwind.css'],
  modules: ['@unocss/nuxt'],
  unocss: {
    presets: [presetUno(), presetDaisy()]
  }
});
```

## Config

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

## Limitations

**This is not a full daisyUI port.** All daisyUI components/utilities should work but they may not work with some UnoCSS features.

**Unused styles may be imported.** This is both due to lots of hacks being used and how UnoCSS works. However, the preset will try to figure out the minimum styles needed, thus the cost is trivial most of the time.
