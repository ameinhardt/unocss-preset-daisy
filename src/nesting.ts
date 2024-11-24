import postcss, { type Plugin } from 'postcss';
import Nested from 'postcss-nested';

function WrapNesting(): Plugin {
  return {
    Once(root, { result }) {
      root.walkAtRules('screen', (rule) => {
        rule.name = 'media';
        rule.params = `screen(${rule.params})`;
      });

      root.walkAtRules('apply', (rule) => {
        rule
          .before(postcss.decl({
            prop: '__apply',
            value: rule.params
          }))
          .remove();
      });

      postcss([Nested]).process(root, result.opts).sync();

      root.walkDecls('__apply', (decl) => {
        decl
          .before(postcss.atRule({
            name: 'apply',
            params: decl.value
          }))
          .remove();
      });
    },
    postcssPlugin: 'wrapNesting'
  };
};

WrapNesting.postcss = true;
WrapNesting.default = WrapNesting;

export default WrapNesting;
