import type { ChildNode, Declaration, Processor, Root } from 'postcss';
import type { CSSObjectInput, DynamicRule, Preflight, Preset, UserConfig } from 'unocss';
import { createPlugin } from '@unocss/postcss/esm';
import base from 'daisyui/dist/base.js';
import styled from 'daisyui/dist/styled.js';
import unstyled from 'daisyui/dist/unstyled.js';
import utilStyled from 'daisyui/dist/utilities-styled.js';
import utilUnstyled from 'daisyui/dist/utilities-unstyled.js';
import utilityClasses from 'daisyui/dist/utilities.js';
import functions from 'daisyui/src/theming/functions.js';
import colors from 'daisyui/src/theming/index.js';
import themes from 'daisyui/src/theming/themes.js';
import postcss from 'postcss';
import { presetUno, symbols } from 'unocss';
import parse from './parser.js';

const CSSCLASS = /\.(?<name>[-\w\P{ASCII}]+)/gu,
  FOLDERS = {
    'base': base,
    'components/styled': styled,
    'components/unstyled': unstyled,
    'utilities/global': utilityClasses,
    'utilities/styled': utilStyled,
    'utilities/unstyled': utilUnstyled
  } as Record<string, Record<string, any>>;

function fixCss(css: string) {
  return css
    .replaceAll(/(var\s*\(\s*)?--(?:tw-)+([-\w]+)?/g, '$1--un-$2')
    .replaceAll('<alpha-value>', 'var(--un-bg-opacity, 1)');
}

function *flattenRules(nodes: ChildNode[], parents: string[] = []): Generator<[string[], string, Declaration[]] | string> {
  for (const node of nodes) {
    if (node.type === 'comment') {
      continue;
    } else if (node.type === 'rule') {
      const declarations = node.nodes.filter(({ type }) => type === 'decl') as Declaration[];
      if (declarations.length !== node.nodes.filter(({ type }) => type !== 'comment').length) {
        throw new Error('unexpected mixed declarations node');
      }
      if (declarations.length) {
        node.nodes = declarations;
        yield [parents, node.selector, declarations];
      }
    } else if (node.type === 'atrule') {
      if (node.nodes.length === 0) {
        continue;
      }
      if (node.name === 'keyframes') {
        yield node.toString();
      } else {
        yield * flattenRules(node.nodes, [...parents, `@${node.name}${node.raws.afterName ?? ' '}${node.params ?? ''}`]);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('skipping', node.type);
    }
  }
}

function getUnoCssElements(processor: Processor, root: Root, cssObjectInputsByClassToken: Map<string, Promise<CSSObjectInput[]>[]>, layer?: string): Preflight[] {
  const preflights: Preflight[] = [];
  flattenRules(root.nodes)
    .forEach((rawElement, idx) => {
      if (typeof rawElement === 'string') {
        const p = processor.process(rawElement, { from: 'preflight', to: 'preflight' });
        preflights.push({
          getCSS: async () => {
            const ast = await p;
            return ast.css;
          },
          layer
        });
        return;
      }
      const [parents, selector, nodes] = rawElement,
        classTokens = new Set(selector.matchAll(CSSCLASS).map(([, name]) => name));

      if (classTokens.size === 0) {
        throw new Error('why include this rule?');
      }

      const p = processor.process(postcss.root({ nodes }), { from: 'component', to: 'component' });

      for (const classToken of classTokens) {
        let cssObjectInputs = cssObjectInputsByClassToken.get(classToken);
        if (cssObjectInputs == null) {
          cssObjectInputs = [];
          cssObjectInputsByClassToken.set(classToken, cssObjectInputs);
        }
        cssObjectInputs.push(p.then((declarations) => [{
          ...Object.fromEntries((declarations.root.nodes as Declaration[]).map(({ important, prop, value }) => [prop, `${value}${important ? ' !important' : ''}`])),
          [symbols.parent]: parents.join(' $$ '),
          [symbols.selector]: (currentSelector) =>
            selector === currentSelector
              ? selector
              : selector.replaceAll(CSSCLASS, (all, c) => {
                return c === classToken ? currentSelector : all;
              }),
          [symbols.sort]: idx
        }]));
      };
    });
  return preflights;
}

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
    cssObjectInputsByClassToken = new Map<string, Promise<CSSObjectInput[]>[]>(),
    classes: ['components', 'utilities'?] = ['components'],
    styles: ['unstyled', 'styled'?] = ['unstyled'],
    preflights: Preflight[] = [],
    configOrPath: UserConfig = {
      configFile: false,
      presets: [presetUno(), () => presetDaisy({
        ...userOptions,
        base: false,
        themes: false,
        utils: false
      })]
    },
    processor = postcss({
      Declaration: (decl) => {
        decl.prop = fixCss(decl.prop);
        decl.value = fixCss(decl.value);
      },
      postcssPlugin: 'fix-css'
    }, createPlugin({ configOrPath }));

  if (options.utils) {
    preflights.push(...getUnoCssElements(processor, parse(FOLDERS['utilities/global']), cssObjectInputsByClassToken));
    classes.push('utilities');
  }
  if (options.styled) {
    styles.push('styled');
  }
  if (options.base) {
    const p = processor.process(parse(FOLDERS.base), { from: 'theme', to: 'theme' });
    preflights.push({
      getCSS: async () => p.then(({ css }) => css),
      layer: 'daisy-base'
    });
  }

  functions.injectThemes(
    (theme) => {
      const p = processor.process(parse(theme), { from: 'theme', to: 'theme' });
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

  for (const folder of classes.flatMap((cls) => styles.map((style) => `${cls}/${style}`))) {
    preflights.push(...getUnoCssElements(processor, parse(FOLDERS[folder]), cssObjectInputsByClassToken, 'daisy-components'));
  }

  const rules: DynamicRule[] = [];
  for (const [classToken, cssObjectInputs] of cssObjectInputsByClassToken) {
    rules.push([new RegExp(`^${classToken}$`), async () =>
      Promise.all(cssObjectInputs).then((multiple) => multiple.flat())]
    );
  }

  return {
    name: 'unocss-preset-daisy',
    preflights,
    rules,
    theme: {
      colors: Object.fromEntries(Object.entries(colors as Record<string, string>).map(([key, value]) => [key, fixCss(value)]))
    }
  };
}
