import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['./src/index'],
  externals: [],
  rollup: {
    emitCJS: false,
    inlineDependencies: false
  }
});
