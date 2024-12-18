import type { ChildNode, Declaration, PluginCreator } from 'postcss';
import type { CSSObjectInput, DynamicRule, Preflight, Preset } from 'unocss';
import Nesting from '@tailwindcss/nesting';
import daisyui from 'daisyui';
// import { createPlugin } from '@unocss/postcss/esm';
import postcss from 'postcss';
import Stringifier from 'postcss/lib/stringifier';
import { symbols } from 'unocss';
import parse from './parser.js';

interface Options {
  base?: boolean
  darkTheme?: boolean
  logs?: boolean // ignored
  prefix?: string
  styled?: boolean
  themeRoot?: string // :root
  themes?: string[]
  utils?: boolean
}

const CSSCLASS = /\.(?<name>[-\w\P{ASCII}]+)/gu;

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
      if (node.nodes == null || node.nodes.length === 0) {
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

function getUnoCssElements(childNodes: ChildNode[], cssObjectInputsByClassToken: Map<string, CSSObjectInput[]>, layer?: string): Preflight[] {
  const preflights: Preflight[] = [];
  flattenRules(childNodes)
    .forEach((rawElement, idx) => {
      if (typeof rawElement === 'string') {
        preflights.push({
          getCSS: () => rawElement,
          layer
        });
        return;
      }
      const [parents, selector, declarations] = rawElement,
        classTokens = new Set(selector.matchAll(CSSCLASS).map(([, name]) => name));

      if (classTokens.size === 0) {
        throw new Error('why include this rule?');
      }

      for (const classToken of classTokens) {
        let cssObjectInputs = cssObjectInputsByClassToken.get(classToken);
        if (cssObjectInputs == null) {
          cssObjectInputs = [];
          cssObjectInputsByClassToken.set(classToken, cssObjectInputs);
        }
        cssObjectInputs.push({
          ...Object.fromEntries((declarations).map(({ important, prop, value }) => [prop, `${value}${important ? ' !important' : ''}`])),
          [symbols.layer]: layer,
          [symbols.parent]: parents.join(' $$ '),
          [symbols.selector]: (currentSelector) =>
            selector === currentSelector
              ? selector
              : selector.replaceAll(CSSCLASS, (all, c) => {
                return c === classToken ? currentSelector : all;
              }),
          [symbols.sort]: idx
        });
      };
    });
  return preflights;
}

export async function presetDaisy(options?: Options): Promise<Preset<Record<string, any>>> {
  const cssObjectInputsByClassToken = new Map<string, CSSObjectInput[]>(),
    processor = postcss({
      Once(root) {
        root.walkAtRules((atRule) => {
          if (atRule.name === 'starting-style' && atRule.parent?.type === 'rule') {
            let value = '{';
            (new Stringifier((str) => value += str)).body(atRule);
            value += '}';
            atRule.replaceWith(postcss.decl({ prop: `@${atRule.name}`, value }));
          }
        });
      },
      postcssPlugin: 'fix-css'
    }, Nesting as PluginCreator<never>),
    /*  no need for unocss/postcss, as there's no @apply, @screen, @theme in input. Otherwise:
    createPlugin({ configOrPath: {
      configFile: false,
      presets: [presetUno(), () => presetDaisy({
        ...userOptions,
        base: false,
        themes: false,
        utils: false
      })]
    } }); */
    // eslint-disable-next-line ts/no-unsafe-assignment
    { config, handler }: { config: Partial<Preset<Record<string, any>>>, handler: (arg: any) => void } = typeof daisyui === 'function' ? (daisyui as (o: any) => any)(options) : daisyui,
    preflightPromises: Promise<Preflight[]>[] = [];
  handler({
    addBase(jsCss: Record<string, any>) {
      preflightPromises.push(Promise.resolve([{
        getCSS: () => parse(jsCss).toString(),
        layer: 'daisy-base'
      }]));
    },
    addComponents(jsCss: Record<string, any>) {
      preflightPromises.push(
        processor.process(parse(jsCss), { from: 'components', to: 'components' })
          .then((ast) => getUnoCssElements(ast.root.nodes, cssObjectInputsByClassToken, 'daisy-components'))
      );
    },
    addUtilities(jsCss: Record<string, any>) {
      preflightPromises.push(
        processor.process(parse(jsCss), { from: 'utilities', to: 'utilities' })
          .then((ast) => getUnoCssElements(ast.root.nodes, cssObjectInputsByClassToken, 'daisy-utilities'))
      );
    },
    config: (key: `${string}.${keyof Options}`) => options?.[key.split('.')[1]] as Options[keyof Options] | undefined // for daisyui v4
  });

  const preflights = await Promise.all(preflightPromises).then((p) => p.flat()),
    rules: DynamicRule[] = [];
  for (const [classToken, cssObjectInputs] of cssObjectInputsByClassToken) {
    rules.push([new RegExp(`^${classToken}$`), () => cssObjectInputs]);
  }

  return {
    ...config,
    name: 'unocss-preset-daisy',
    preflights,
    rules
  };
}
