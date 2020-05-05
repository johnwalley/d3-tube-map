import { terser } from 'rollup-plugin-terser';
import * as meta from './package.json';

const dependencies = Object.keys(meta.dependencies);

const config = {
  input: 'src/index.js',
  external: dependencies,
  output: {
    extend: true,
    file: `dist/${meta.name}.js`,
    format: 'umd',
    globals: dependencies.reduce((p, v) => ((p[v] = 'd3'), p), {}),
    name: 'd3',
    banner: `// ${meta.homepage} v${
      meta.version
    } Copyright ${new Date().getFullYear()} ${meta.author.name}`,
  },
  plugins: [],
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.min.js`,
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner,
        },
      }),
    ],
  },
];
