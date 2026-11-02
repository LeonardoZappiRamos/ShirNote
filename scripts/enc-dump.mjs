#!/usr/bin/env node
/**
 * Dump hexadecimal de uma amostra `.enc` (Fase 1, tarefa 1.3).
 *
 * Uso:
 *   node scripts/enc-dump.mjs "tests/fixtures/samples/arquivo.enc"
 *   node scripts/enc-dump.mjs arquivo.enc --offset 512 --length 256
 *   node scripts/enc-dump.mjs arquivo.enc --strings --min 6
 *   node scripts/enc-dump.mjs arquivo.enc --json
 */
import { readFile } from 'node:fs/promises';

/** Bytes extras medidos fora do tamanho declarado (ver docs/enc-format.md). */
const TRAILERS = { MEAS: 54 };

const args = process.argv.slice(2);

function flagValue(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

function numericFlag(name, fallback) {
  const raw = flagValue(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    console.error(`Valor inválido para ${name}: ${raw}`);
    process.exit(1);
  }
  return value;
}

const file = args.find((arg) => !arg.startsWith('--') && !/^\d+$/.test(arg));
if (!file) {
  console.error(
    'Uso: node scripts/enc-dump.mjs <arquivo.enc> [--offset N] [--length N] [--strings] [--min N] [--json]',
  );
  process.exit(1);
}

const data = await readFile(file);
const offset = numericFlag('--offset', 0);
const length = numericFlag('--length', Math.min(data.length - offset, 512));
const minStringLength = numericFlag('--min', 4);
const onlyStrings = args.includes('--strings');
const asJson = args.includes('--json');
const tagsMode = args.includes('--tags');
const chunksMode = args.includes('--chunks');

const slice = data.subarray(offset, offset + length);

function hexDump(bytes) {
  const rows = [];
  for (let index = 0; index < bytes.length; index += 16) {
    const row = bytes.subarray(index, index + 16);
    const hex = Array.from(row, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(
      ' ',
    );
    const ascii = Array.from(row, (byte) =>
      byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.',
    ).join('');
    rows.push({
      offset: offset + index,
      hex: hex.padEnd(47, ' '),
      ascii,
    });
  }
  return rows;
}

function stringsOf(bytes) {
  const found = [];
  let start = -1;
  let current = '';
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    const printable = byte >= 0x20 && byte <= 0x7e;
    if (printable) {
      if (start === -1) start = index;
      current += String.fromCharCode(byte);
      continue;
    }
    if (current.length >= minStringLength) {
      found.push({ offset: offset + start, text: current, length: current.length });
    }
    start = -1;
    current = '';
  }
  if (current.length >= minStringLength) {
    found.push({ offset: offset + start, text: current, length: current.length });
  }
  return found;
}

/** Procura candidatos a tag de bloco: 4 bytes maiúsculos/dígitos, agrupados por frequência. */
function tagsOf(bytes) {
  const counts = new Map();
  for (let index = 0; index + 4 <= bytes.length; index += 1) {
    const candidate = bytes.toString('latin1', index, index + 4);
    if (!/^[A-Z][A-Z0-9]{3}$/.test(candidate)) continue;
    const entry = counts.get(candidate) ?? { count: 0, offsets: [] };
    entry.count += 1;
    if (entry.offsets.length < 40) entry.offsets.push(offset + index);
    counts.set(candidate, entry);
  }
  return [...counts.entries()]
    .filter(([, entry]) => entry.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([tag, entry]) => ({ tag, count: entry.count, offsets: entry.offsets }));
}

/**
 * Tenta ler uma cadeia de blocos `tag[4] + uint32LE(tamanho) + payload`.
 * A cadeia vencedora é a mais longa que termina no fim do arquivo.
 */
function chunkChain(bytes) {
  const isTag = (position) =>
    position + 4 <= bytes.length &&
    /^[A-Z][A-Z0-9]{3}$/.test(bytes.toString('latin1', position, position + 4));

  const parseFrom = (start) => {
    const chunks = [];
    let position = start;
    while (isTag(position) && position + 8 <= bytes.length) {
      const tag = bytes.toString('latin1', position, position + 4);
      const length = bytes.readUInt32LE(position + 4);
      const trailer = TRAILERS[tag] ?? 0;
      if (length + trailer > bytes.length - position - 8) break;
      chunks.push({
        offset: position,
        tag,
        length,
        trailer,
        payload: position + 8,
        end: position + 8 + length + trailer,
      });
      position += 8 + length + trailer;
    }
    return { chunks, end: position };
  };

  let best = { chunks: [], end: 0 };
  const limit = Math.min(bytes.length, 8192);
  for (let start = 0; start < limit; start += 1) {
    const chain = parseFrom(start);
    const endsClean = chain.end === bytes.length;
    const bestEndsClean = best.end === bytes.length;
    if (
      chain.chunks.length >= 3 &&
      (chain.chunks.length > best.chunks.length || (endsClean && !bestEndsClean))
    ) {
      best = chain;
    }
  }
  return best;
}

const result = {
  file,
  byteLength: data.length,
  range: { offset, length: slice.length },
  rows: onlyStrings || tagsMode || chunksMode ? [] : hexDump(slice),
  strings: stringsOf(slice),
  tags: tagsMode ? tagsOf(slice) : [],
  chunks: chunksMode ? chunkChain(data).chunks : [],
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`${file}`);
  console.log(`tamanho: ${data.length} bytes`);
  console.log(`faixa: ${offset}..${offset + slice.length} (${slice.length} bytes)`);
  if (!onlyStrings) {
    for (const row of result.rows) {
      console.log(
        `${row.offset.toString(16).toUpperCase().padStart(8, '0')}  ${row.hex} |${row.ascii}|`,
      );
    }
  }
  if (result.strings.length > 0) {
    console.log('\nstrings:');
    for (const entry of result.strings) {
      console.log(`  ${entry.offset.toString(16).toUpperCase().padStart(8, '0')}  ${entry.text}`);
    }
  }
  if (result.tags.length > 0) {
    console.log('\ntags candidatas (4 bytes A-Z/0-9):');
    for (const entry of result.tags) {
      const offsets = entry.offsets
        .slice(0, 8)
        .map((value) => value.toString(16).toUpperCase().padStart(8, '0'))
        .join(' ');
      console.log(`  ${entry.tag}  ${String(entry.count).padStart(3)}x  ${offsets}`);
    }
  }
  if (result.chunks.length > 0) {
    console.log(`\nblocos (${result.chunks.length}):`);
    for (const chunk of result.chunks) {
      const offsetHex = chunk.offset.toString(16).toUpperCase().padStart(8, '0');
      console.log(
        `  ${offsetHex}  ${chunk.tag}  ${String(chunk.length).padStart(6)} bytes  payload@${chunk.payload
          .toString(16)
          .toUpperCase()
          .padStart(8, '0')}${chunk.trailer > 0 ? `  +trailer ${chunk.trailer}` : ''}`,
      );
    }
  }
}
