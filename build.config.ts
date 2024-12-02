import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['./src/index'],
  externals: [
    '@unocss/postcss/esm',
    'culori/require'
  ],
  rollup: {
    emitCJS: false,
    inlineDependencies: false
  }
});
