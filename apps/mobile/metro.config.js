const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// O núcleo (src/enc, src/music, src/musicxml) é compartilhado sem cópia com o app (ADR 0005).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// viewer.html é gerado por `npm run viewer:build` e embutido na WebView.
config.resolver.assetExts.push('html');

module.exports = config;
