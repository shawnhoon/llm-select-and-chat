import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import replace from '@rollup/plugin-replace';

// Load package.json using ES module approach
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// The base config for all builds
const baseConfig = {
  input: 'src/index.ts',
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__', '**/*.test.ts', '**/*.test.tsx']
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
    }),
  ],
  external: ['react', 'react-dom', 'styled-components'],
};

// The vanilla JS standalone build
const vanillaConfig = {
  input: 'src/vanilla.ts',
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__', '**/*.test.ts', '**/*.test.tsx']
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
    }),
    terser(),
  ],
  // Include dependencies in the bundle for standalone use
  external: [],
};

export default [
  // ESM build
  {
    ...baseConfig,
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
  },
  
  // CommonJS build
  {
    ...baseConfig,
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
  },
  
  // UMD build (minified, for browsers)
  {
    ...baseConfig,
    plugins: [
      ...baseConfig.plugins,
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      }),
      terser()
    ],
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'LLMSelectAndChat',
      sourcemap: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'styled-components': 'styled',
      },
    },
  },
  
  // Vanilla JS build (UMD, standalone with all dependencies)
  {
    ...vanillaConfig,
    output: {
      file: packageJson.browser,
      format: 'umd',
      name: 'LLMSelectAndChat',
      sourcemap: true,
      exports: 'named',
    },
  },
  
  // Types
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
  
  // Types for vanilla.js
  {
    input: 'dist/vanilla.d.ts',
    output: [{ file: 'dist/vanilla.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
]; 