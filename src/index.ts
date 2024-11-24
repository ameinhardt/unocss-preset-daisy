import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { createPlugin } from '@unocss/postcss/esm';
import utilityClasses from 'daisyui/src/lib/utility-classes.js';
import functions from 'daisyui/src/theming/functions.js';
import colors from 'daisyui/src/theming/index.js';
import themes from 'daisyui/src/theming/themes.js';
import { type DynamicRule, type Preset, presetUno, symbols, type UserConfig } from 'unocss';
import NestingWrapper from './nesting.js';
// import { type ClassToken, tokenize } from 'parsel-js';
import type { ChildNode, Declaration, Processor } from 'postcss';
import { fileURLToPath } from 'node:url';

import postcss from 'postcss';
import parse from './parser.js';

const DAISYSRC = dirname(fileURLToPath(import.meta.resolve('daisyui'))),
  components = {
    'alert': 'alert.css',
    'artboard': 'artboard.css',
    'avatar': 'avatar.css',
    'badge': 'badge.css',
    'breadcrumbs': 'breadcrumbs.css',
    'btm-nav': 'bottom-navigation.css',
    'btn': 'button.css',
    'card': 'card.css',
    'carousel': 'carousel.css',
    'chat': 'chat.css',
    'checkbox': 'checkbox.css',
    'collapse': 'collapse.css',
    'countdown': 'countdown.css',
    'diff': 'diff.css',
    'divider': 'divider.css',
    'drawer': 'drawer.css',
    'dropdown': 'dropdown.css',
    'file-input': 'file-input.css',
    'footer': 'footer.css',
    'form': 'form.css',
    'hero': 'hero.css',
    'indicator': 'indicator.css',
    'input': 'input.css',
    'join': 'join.css',
    'kbd': 'kbd.css',
    'link': 'link.css',
    'loading': 'loading.css',
    'mask': 'mask.css',
    'menu': 'menu.css',
    'mockup': 'mockup.css',
    'modal': 'modal.css',
    'navbar': 'navbar.css',
    'progress': 'progress.css',
    'prose': 'typography.css',
    'radial-progress': 'radial-progress.css',
    'radio': 'radio.css',
    'range': 'range.css',
    'rating': 'rating.css',
    'select': 'select.css',
    'skeleton': 'skeleton.css',
    'stack': 'stack.css',
    'stats': 'stat.css',
    'steps': 'steps.css',
    'swap': 'swap.css',
    'table': 'table.css',
    'tabs': 'tab.css',
    'textarea': 'textarea.css',
    'timeline': 'timeline.css',
    'toast': 'toast.css',
    'toggle': 'toggle.css',
    'tooltip': 'tooltip.css'
  };

function fixCss(css: string) {
  return css
    .replaceAll('--tw-', '--un-')
    .replaceAll('<alpha-value>', 'var(--un-bg-opacity, 1)');
}

function *postCssToUno(nodes: ChildNode[], parents = []) {
  for (const node of nodes) {
    if (node.type === 'comment') {
      continue;
    } else if (node.type === 'rule') {
      const declarations = node.nodes.filter(({ type }) => type === 'decl') as Declaration[];
      if (declarations.length !== node.nodes.filter(({ type }) => type !== 'comment').length) {
        throw new Error('unexpected mixed declarations node');
      }
      if (declarations.length) {
        yield {
          ...Object.fromEntries(declarations.map(({ prop, value }) => [prop, value])),
          [symbols.parent]: parents.join(' $$ '),
          [symbols.selector]: () => node.selector
        };
      }
    } else if (node.type === 'atrule') {
      if (node.nodes.length === 0) {
        continue;
      }
      if (node.name === 'keyframes') {
        yield node.toString();
      } else {
        yield * postCssToUno(node.nodes, [...parents, `@${node.name}${node.raws.afterName ?? ' '}${node.params ?? ''}`]);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('skipping', node.type);
    }
  }
}

function getRule(name: string, directories: string[], filename: string, processor: Processor): DynamicRule {
  const css = directories.map((directory) => {
    try {
      return fs.readFileSync(path.join(DAISYSRC, directory, filename)).toString();
    } catch {}
    return undefined;
  }).filter(Boolean).join('\n');
  if (css.length === 0) {
    return;
  }
  const p = processor.process(fixCss(css), { from: filename, to: filename });
  return [new RegExp(`^${name}$`), async function* (_match, _opts) {
    // const { variantHandlers } = opts,
    // const { constructCSS, currentSelector, rawSelector, theme, variantHandlers } = opts,
    //   selector = toEscapedSelector(rawSelector);
    const ast = await p;
    yield * postCssToUno(ast.root.nodes);
  }, {
    layer: 'daisy-components'
  }];
}

function getRules(directories: Array<string>, processor: Processor) { // 'components/styled' | 'components/unstyled' | 'utilities/styled' | 'utilities/unstyled'
  const rules = [];
  for (const name in components) {
    const rule = getRule(name, directories, components[name], processor);
    if (rule != null) {
      rules.push(rule);
    }
  }
  return rules;
}

// replacePrefix = (css: string) => css.replaceAll('--tw-', '--un-'),

const defaultOptions = {
  base: true,
  darkTheme: 'dark',
  rtl: false,
  styled: true,
  themes: false as
  | Array<Record<string, Record<string, string>> | string>
  | boolean,
  utils: true
};

export function presetDaisy(userOptions: Partial<typeof defaultOptions> = {}): Preset {
  const options = { ...defaultOptions, ...userOptions },
    rules: DynamicRule[] = [],
    classes: ['components', 'utilities'?] = ['components'],
    styles: ['unstyled', 'styled'?] = ['unstyled'],
    preflights: Preset['preflights'] = [],
    configOrPath: UserConfig = {
      configFile: false,
      presets: [presetUno(), () => presetDaisy({
        ...userOptions,
        base: false,
        themes: false,
        utils: false
      })]
      // transformers: [transformerDirectives()]
    },
    processor = postcss(NestingWrapper(), createPlugin({ configOrPath }));

  if (options.utils) {
    rules.push(getRule('glass', ['utilities/global'], 'glass.css', processor));
    classes.push('utilities');
  }
  if (options.styled) {
    styles.push('styled');
  }
  if (options.base) {
    const combinedCss = ['general', 'colors']
        .map((name) => fs.readFileSync(path.join(DAISYSRC, 'base', `${name}.css`)).toString())
        .join('\n'),
      p = processor.process(fixCss(combinedCss), { from: 'base', to: 'base' });
    preflights.push({
      getCSS: async () => {
        const ast = await p;
        return ast.css;
      },
      layer: 'daisy-base'
    });
  }

  rules.push(...getRules(classes.flatMap((cls) => styles.map((style) => `${cls}/${style}`)), processor));

  functions.injectThemes(
    (theme) => {
      const css = parse(theme).toString(),
        p = processor.process(fixCss(css), { from: 'theme', to: 'theme' });
      preflights.push({
        getCSS: async () => {
          const ast = await p;
          return ast.css;
        },
        layer: 'daisy-themes'
      });
    },
    (key: string) => options[key.split('.')[1]],
    themes
  );

  return {
    name: 'unocss-preset-daisy',
    preflights,
    rules,
    theme: {
      colors: Object.fromEntries(Object.entries(colors as Record<string, string>).map(([key, value]) => [key, fixCss(value)])),
      ...utilityClasses
    }
  };
}
