import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

/** @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  format: 'iife',
  target: ['chrome90'],
};

// Build background script
await esbuild.build({
  ...common,
  entryPoints: {
    background: path.join(root, 'src/background/background.ts'),
  },
  outdir: path.join(root, 'dist'),
  loader: { '.ts': 'ts' },
});

// Build content script with React
await esbuild.build({
  bundle: true,
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  format: 'cjs',
  target: ['chrome90'],
  entryPoints: {
    content: path.join(root, 'src/content/content.tsx'),
  },
  outdir: path.join(root, 'dist'),
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  external: [],
  banner: {
    js: '(function() { "use strict";',
  },
  footer: {
    js: '})();',
  },
});

// Note: Popup removed - using only content injection
// If you want a popup later, uncomment the section below:
/*
await esbuild.build({
  ...common,
  entryPoints: {
    popup: path.join(root, 'src/popup/popup.tsx'),
  },
  outdir: path.join(root, 'dist'),
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
});
*/

// Copy static assets
const distDir = path.join(root, 'dist');
await fs.mkdir(distDir, { recursive: true });
await fs.copyFile(path.join(root, 'public/manifest.json'), path.join(distDir, 'manifest.json'));
// No popup files needed since we're using content injection only
await fs.copyFile(path.join(root, 'src/styles/content.css'), path.join(distDir, 'content.css'));
await fs.copyFile(path.join(root, 'src/styles/ChatWidget.css'), path.join(distDir, 'ChatWidget.css'));
// Removed popup.css as we're not using a popup

console.log('Build completed');