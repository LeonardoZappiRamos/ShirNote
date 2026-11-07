import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewerRoot = path.join(repositoryRoot, 'apps/mobile/viewer');
const outDir = path.join(repositoryRoot, 'apps/mobile/.viewer-build');
const targetFile = path.join(repositoryRoot, 'apps/mobile/assets/viewer.html');
const osmdLicenseFile = path.join(repositoryRoot, 'node_modules/opensheetmusicdisplay/LICENSE');

/**
 * Gera um único HTML autocontido para a WebView: sem rede, sem arquivos externos (RNFM-01).
 * O OSMD vai embutido porque o visualizador não pode buscar nada.
 */
async function buildViewer() {
  await rm(outDir, { recursive: true, force: true });

  await build({
    configFile: false,
    root: viewerRoot,
    base: './',
    publicDir: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      target: 'es2017',
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      minify: 'oxc',
    },
  });

  const htmlPath = path.join(outDir, 'index.html');
  let html = await readFile(htmlPath, 'utf8');

  html = await inlineScripts(html, outDir);
  html = await inlineStyles(html, outDir);
  html = html.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/gi, '');

  if ((html.match(/<!doctype html/gi) ?? []).length !== 1) {
    throw new Error('O visualizador gerado ficou com o HTML duplicado dentro do script.');
  }

  if (/<(?:script|link)\b[^>]*(?:src|href)=/i.test(html)) {
    throw new Error('O visualizador gerado ainda referencia um arquivo externo.');
  }

  const license = await readFile(osmdLicenseFile, 'utf8');
  html = html.replace(
    '</head>',
    `  <meta name="generator" content="ShirNote viewer" />\n` +
      `  <!-- OpenSheetMusicDisplay (BSD-3-Clause):\n${license
        .trim()
        .split('\n')
        .map((line) => `       ${line}`)
        .join('\n')}\n  -->\n</head>`,
  );

  await mkdir(path.dirname(targetFile), { recursive: true });
  await writeFile(targetFile, html, 'utf8');
  await rm(outDir, { recursive: true, force: true });

  const kilobytes = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  console.log(
    `viewer.html gerado (${kilobytes} kB) em ${path.relative(repositoryRoot, targetFile)}`,
  );
}

async function inlineScripts(html, baseDir) {
  const pattern = /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi;
  let result = html;

  for (const match of html.matchAll(pattern)) {
    const sourcePath = resolveOutputPath(baseDir, match[1]);
    const code = await readFile(sourcePath, 'utf8');
    const safeCode = code.replace(/<\/script/gi, '<\\/script');
    // Função como substituto: o código minificado do OSMD tem `$&`/`` $` ``, que uma string de
    // substituição expandiria em pedaços do HTML e quebraria o script.
    // `type="module"` mantém o adiamento: o script fica no <head> e precisa de #score já no DOM.
    result = result.replace(match[0], () => `<script type="module">${safeCode}</script>`);
  }

  return result;
}

async function inlineStyles(html, baseDir) {
  const pattern = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/gi;
  let result = html;

  for (const match of html.matchAll(pattern)) {
    const sourcePath = resolveOutputPath(baseDir, match[1]);
    const css = await readFile(sourcePath, 'utf8');
    result = result.replace(match[0], () => `<style>${css}</style>`);
  }

  return result;
}

function resolveOutputPath(baseDir, reference) {
  const withoutQuery = reference.split('?')[0] ?? reference;
  const relative = withoutQuery.replace(/^\.\//, '');
  return path.join(baseDir, relative);
}

await buildViewer();
