import postcss, { type Container } from 'postcss';

// derived from https://github.com/postcss/postcss-js/blob/b3db658b932b42f6ac14ca0b1d50f50c4569805b/parser.js, MIT, Copyright 2015 Andrey Sitnik <andrey@sitnik.ru>
const IMPORTANT = /\s*!important\s*$/i,
  UNITLESS = new Set(['box-flex', 'box-flex-group', 'column-count', 'fill-opacity', 'flex', 'flex-grow', 'flex-negative', 'flex-positive', 'flex-shrink', 'font-weight', 'line-clamp', 'line-height', 'opacity', 'order', 'orphans', 'stroke-dashoffset', 'stroke-opacity', 'stroke-width', 'tab-size', 'widows', 'z-index', 'zoom']);

function dashify(str: string) {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/^ms-/, '-ms-')
    .toLowerCase();
}

function decl(parent: Container, name: string, value: false | null | number | string) {
  if (value === false || value === null) {
    return;
  }

  if (!name.startsWith('--')) {
    name = dashify(name);
  }

  if (typeof value === 'number') {
    if (value === 0 || UNITLESS.has(name)) {
      value = value.toString();
    } else {
      value = `${value}}px`;
    }
  }

  if (name === 'css-float') {
    name = 'float';
  }

  if (IMPORTANT.test(value)) {
    value = value.replace(IMPORTANT, '');
    parent.push(postcss.decl({ important: true, prop: name, value }));
  } else {
    parent.push(postcss.decl({ prop: name, value }));
  }
}

function atRule(parent: Container, parts: string[], value: any) {
  const node = postcss.atRule({ name: parts[1], params: parts[3] || '' });
  if (typeof value === 'object') {
    node.nodes = [];
    parse(value, node);
  }
  parent.push(node);
}

function parse<T extends Container>(obj: Record<string, any>, parent: T): T {
  for (const name in obj) {
    const value = obj[name];
    if (value === null || typeof value === 'undefined') {
      continue;
    } else if (name[0] === '@') {
      const parts = name.match(/@(\S+)(\s+([\s\S]*))?/);
      if (Array.isArray(value)) {
        for (const item of value) {
          atRule(parent, parts, item);
        }
      } else {
        atRule(parent, parts, value);
      }
    } else if (Array.isArray(value)) {
      for (const i of value) {
        decl(parent, name, i);
      }
    } else if (typeof value === 'object') {
      const node = postcss.rule({ selector: name });
      parse(value, node);
      parent.push(node);
    } else {
      decl(parent, name, value);
    }
  }
  return parent;
}

export default function parser(obj: Record<string, any>) {
  return parse(obj, postcss.root());
}
