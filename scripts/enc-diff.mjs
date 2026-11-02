#!/usr/bin/env node
/**
 * Compara dois arquivos `.enc` bloco a bloco (Fase 1).
 *
 * Serve para as amostras controladas de `tests/fixtures/controlled/`: duas partituras que diferem em
 * um único campo mostram exatamente quais bytes mudaram.
 *
 * Uso:
 *   node scripts/enc-diff.mjs a.enc b.enc
 *   node scripts/enc-diff.mjs a.enc b.enc --tag MEAS
 *   node scripts/enc-diff.mjs a.enc b.enc --context 8
 */
import { readFile } from 'node:fs/promises';

/** Bytes extras medidos fora do tamanho declarado (ver docs/enc-format.md). */
const TRAILERS = { MEAS: 54 };

const args = process.argv.slice(2);

function numericFlag(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  if (!Number.isInteger(value) || value < 0) {
    console.error(`Valor inválido para ${name}: ${args[index + 1]}`);
    process.exit(1);
  }
  return value;
}

/** Argumentos posicionais: ignora cada flag e o valor que vem depois dela. */
const files = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index].startsWith('--')) {
    index += 1;
    continue;
  }
  files.push(args[index]);
}

if (files.length !== 2) {
  console.error(
    'Uso: node scripts/enc-diff.mjs <a.enc> <b.enc> [--tag MEAS] [--context 8] [--pairs 20]',
  );
  process.exit(1);
}

const onlyTag = args.indexOf('--tag') === -1 ? undefined : args[args.indexOf('--tag') + 1];
const context = numericFlag('--context', 8);
const maxPairs = numericFlag('--pairs', 20);

/** Lê a cadeia de blocos a partir do primeiro `PAGE` (0x930 nas amostras conhecidas). */
function readChain(bytes) {
  const isTag = (position) =>
    position + 4 <= bytes.length &&
    /^[A-Z][A-Z0-9]{3}$/.test(bytes.toString('latin1', position, position + 4));

  let start = -1;
  const limit = Math.min(bytes.length, 8192);
  for (let position = 0; position < limit; position += 1) {
    if (!isTag(position)) continue;
    const tag = bytes.toString('latin1', position, position + 4);
    if (tag !== 'PAGE' && tag !== 'MEAS' && tag !== 'LINE') continue;
    start = position;
    break;
  }
  if (start === -1) return [];

  const chunks = [];
  let position = start;
  while (position + 8 <= bytes.length) {
    if (!isTag(position)) break;
    const tag = bytes.toString('latin1', position, position + 4);
    const declared = bytes.readUInt32LE(position + 4);
    const trailer = TRAILERS[tag] ?? 0;
    if (8 + declared + trailer > bytes.length - position) break;
    chunks.push({
      tag,
      declared,
      payload: position + 8,
      end: position + 8 + declared + trailer,
    });
    position += 8 + declared + trailer;
  }
  return chunks;
}

const hex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');

/** Agrupa offsets que diferem em trechos contíguos. */
function differenceRuns(a, b) {
  const runs = [];
  const shared = Math.min(a.length, b.length);
  for (let position = 0; position < shared; position += 1) {
    if (a[position] === b[position]) continue;
    const last = runs.at(-1);
    if (last && last.end === position) {
      last.end = position + 1;
      continue;
    }
    runs.push({ start: position, end: position + 1 });
  }
  return runs;
}

const [fileA, fileB] = files;
const [bytesA, bytesB] = await Promise.all(files.map((file) => readFile(file)));
const [chainA, chainB] = [readChain(bytesA), readChain(bytesB)];

const nameOf = (file) => file.split(/[\\/]/).pop();
console.log(`${nameOf(fileA)} (${bytesA.length} B)  ×  ${nameOf(fileB)} (${bytesB.length} B)`);

/** Agrupa por tag preservando a ordem de ocorrência. */
function groupByTag(chain) {
  const groups = new Map();
  for (const chunk of chain) {
    const list = groups.get(chunk.tag) ?? [];
    list.push(chunk);
    groups.set(chunk.tag, list);
  }
  return groups;
}

const groupsA = groupByTag(chainA);
const groupsB = groupByTag(chainB);
const tags = new Set([...groupsA.keys(), ...groupsB.keys()]);

for (const tag of [...tags].sort()) {
  if (onlyTag && tag !== onlyTag) continue;
  const listA = groupsA.get(tag) ?? [];
  const listB = groupsB.get(tag) ?? [];

  if (listA.length !== listB.length) {
    console.log(`\n${tag}: ${listA.length} bloco(s) em A, ${listB.length} em B`);
    if (listA.length === 0 || listB.length === 0) continue;
  } else {
    console.log(`\n${tag}: ${listA.length} bloco(s)`);
  }

  const pairs = Math.min(listA.length, listB.length, maxPairs);
  let identical = 0;
  for (let index = 0; index < pairs; index += 1) {
    const a = listA[index];
    const b = listB[index];
    const bodyA = bytesA.subarray(a.payload, a.end);
    const bodyB = bytesB.subarray(b.payload, b.end);

    if (
      a.declared === b.declared &&
      bodyA.length === bodyB.length &&
      differenceRuns(bodyA, bodyB).length === 0
    ) {
      identical += 1;
      continue;
    }

    const runs = differenceRuns(bodyA, bodyB);
    const sizeNote =
      bodyA.length === bodyB.length ? `${bodyA.length} B` : `${bodyA.length} B ≠ ${bodyB.length} B`;
    console.log(`  #${String(index).padStart(2, '0')}  ${sizeNote}  ${runs.length} trecho(s)`);

    for (const run of runs.slice(0, 12)) {
      const from = Math.max(0, run.start - context);
      const to = Math.min(Math.max(bodyA.length, bodyB.length), run.end + context);
      console.log(
        `    +${String(run.start).padStart(3)}  A: ${hex(bodyA.subarray(from, Math.min(to, bodyA.length)))}`,
      );
      console.log(`          B: ${hex(bodyB.subarray(from, Math.min(to, bodyB.length)))}`);
    }
    if (runs.length > 12) console.log(`    … mais ${runs.length - 12} trecho(s)`);
  }

  if (identical > 0) console.log(`  (${identical} par(es) idêntico(s))`);
  if (listA.length > pairs) console.log(`  … limitado a ${pairs} pares (use --pairs N)`);
}
