#!/usr/bin/env node
/**
 * Gera o MusicXML do parser de produto a partir de um ou mais arquivos `.enc` (Fase 2).
 *
 * Serve para inspecionar o resultado em um segundo visualizador (MuseScore, Verovio) — critério do
 * portão G2 — sem passar pela interface. Usa o Vite para carregar os módulos TypeScript do produto,
 * então o arquivo gerado é exatamente o que o navegador produz.
 *
 * Uso:
 *   node scripts/export-musicxml.mjs "tests/fixtures/samples/justica-flauta2.enc"
 *   node scripts/export-musicxml.mjs tests/fixtures/controlled/*.enc --out-dir "$env:TEMP\mx"
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createServer } from 'vite';

const args = process.argv.slice(2);

function flagValue(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const outDir = flagValue('--out-dir');
const singleOut = flagValue('--out');

/** Argumentos posicionais: pula cada flag e o valor que vem depois dela. */
const files = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index].startsWith('--')) {
    index += 1;
    continue;
  }
  files.push(args[index]);
}

if (files.length === 0) {
  console.error(
    'Uso: node scripts/export-musicxml.mjs <arquivo.enc…> [--out saida.musicxml | --out-dir pasta]',
  );
  process.exit(1);
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { parseEncore } = await server.ssrLoadModule('/src/enc/parser.ts');
  const { generateMusicXml } = await server.ssrLoadModule('/src/musicxml/index.ts');

  if (outDir) await mkdir(outDir, { recursive: true });

  for (const file of files) {
    const { score, warnings } = parseEncore(new Uint8Array(await readFile(file)));
    const xml = generateMusicXml(score, { divisions: 240 });
    const name = `${basename(file, '.enc')}.musicxml`;
    const target = singleOut ?? (outDir ? join(outDir, name) : name);
    await writeFile(target, xml, 'utf8');

    const measures = score.parts.reduce((total, part) => total + part.measures.length, 0);
    console.log(`${basename(file)} → ${target}`);
    console.log(
      `  partes: ${score.parts.length}  compassos: ${measures}  avisos: ${warnings.length}`,
    );
    for (const warning of warnings) {
      console.log(`  aviso: ${warning.code} — ${warning.message}`);
    }
  }
} finally {
  await server.close();
}
