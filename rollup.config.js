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
    resolve({
      browser: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__', '**/*.test.ts', '**/*.test.tsx'],
      sourceMap: true,
      inlineSources: true,
      declaration: true,
      declarationDir: './dist/types',
      noEmitOnError: false, // Continue build even with TypeScript errors
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
      inject: {
        insertAt: 'top',
      },
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
  ],
  external: ['react', 'react-dom', 'styled-components', 'react/jsx-runtime'],
  onwarn(warning, warn) {
    // Skip certain warnings
    if (
      warning.code === 'THIS_IS_UNDEFINED' || 
      warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
      warning.code.includes('TS')
    ) return;
    // Use default for everything else
    warn(warning);
  },
};

// The vanilla JS standalone build
const vanillaConfig = {
  input: 'src/vanilla.ts',
  plugins: [
    resolve({ 
      browser: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs({
      include: /node_modules/,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__', '**/*.test.ts', '**/*.test.tsx'],
      sourceMap: true,
      declaration: true,
      declarationDir: './dist/types',
      noEmitOnError: false, // Continue build even with TypeScript errors
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
      inject: {
        insertAt: 'top',
      },
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: false,
      },
    }),
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
      exports: 'named',
    },
  },
  
  // CommonJS build
  {
    ...baseConfig,
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  },
  
  // UMD build (minified, for browsers)
  {
    ...baseConfig,
    plugins: [
      ...baseConfig.plugins,
      terser({
        format: {
          comments: false,
        },
      }),
    ],
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'LLMSelectAndChat',
      sourcemap: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM',
        'styled-components': 'styled',
        'react/jsx-runtime': 'jsxRuntime',
      },
      exports: 'named',
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
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM',
        'styled-components': 'styled',
        'react/jsx-runtime': 'jsxRuntime',
      },
    },
  },
  
  // Types - this will run after the builds above to ensure types are generated
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        emitDeclarationOnly: true,
        declarationDir: 'dist',
        outDir: 'dist',
        noEmitOnError: false, // Continue build even with TypeScript errors
      }),
      dts(),
    ],
  },
  
  // Types for vanilla.js
  {
    input: 'src/vanilla.ts',
    output: [{ file: 'dist/vanilla.d.ts', format: 'es' }],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        emitDeclarationOnly: true,
        declarationDir: 'dist',
        outDir: 'dist',
        noEmitOnError: false, // Continue build even with TypeScript errors
      }),
      dts(),
    ],
  },
]; 