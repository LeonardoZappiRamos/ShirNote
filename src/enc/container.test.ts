import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locateChunkChain, readChunkChain } from './container';

interface SampleSpec {
  readonly file: string;
  readonly size: number;
  readonly chunks: number;
  readonly measures: number;
  readonly lines: number;
}

const SAMPLES: readonly SampleSpec[] = [
  { file: 'justica-flauta2.enc', size: 39_094, chunks: 56, measures: 38, lines: 10 },
  { file: 'tora-sax-tenor.enc', size: 37_112, chunks: 53, measures: 36, lines: 9 },
  { file: 'alegrei-sax-alto.enc', size: 42_198, chunks: 62, measures: 43, lines: 11 },
];

const readSample = (file: string) => new Uint8Array(readFileSync(`tests/fixtures/samples/${file}`));

describe.each(SAMPLES)('contêiner .enc — $file', ({ file, size, chunks, measures, lines }) => {
  const sample = readSample(file);

  it('encontra a cadeia que fecha exatamente no fim do arquivo', () => {
    const located = locateChunkChain(sample);

    expect(sample).toHaveLength(size);
    expect(located.startOffset).toBe(0x930);
    expect(located.endsAtFileEnd).toBe(true);
    expect(located.chunks).toHaveLength(chunks);
  });

  it('reconhece a ordem dos blocos', () => {
    const tags = locateChunkChain(sample).chunks.map((chunk) => chunk.tag);

    expect(tags[0]).toBe('PAGE');
    expect(tags.slice(1, 1 + lines)).toEqual(Array(lines).fill('LINE'));
    expect(tags.slice(1 + lines, 1 + lines + measures)).toEqual(Array(measures).fill('MEAS'));
    expect(tags.slice(1 + lines + measures)).toEqual([
      'PREC',
      'TITL',
      'TEXT',
      'FONT',
      'COLR',
      'DRUM',
      'WINI',
    ]);
  });

  it('aplica o bloco fixo de 54 bytes em cada MEAS', () => {
    const found = locateChunkChain(sample).chunks.filter((chunk) => chunk.tag === 'MEAS');

    expect(found).toHaveLength(measures);
    for (const measure of found) {
      expect(measure.trailerLength).toBe(54);
      expect(sample[measure.endOffset - 2]).toBe(0xff);
      expect(sample[measure.endOffset - 1]).toBe(0xff);
    }
  });

  it('mantém os tamanhos fixos dos blocos de metadados', () => {
    const found = readChunkChain(sample, 0x930);
    const byTag = (tag: string) => found.find((chunk) => chunk.tag === tag);

    expect(byTag('PAGE')?.payloadLength).toBe(26);
    expect(byTag('LINE')?.payloadLength).toBe(56);
    expect(byTag('PREC')?.payloadLength).toBe(5_420);
    expect(byTag('TITL')?.payloadLength).toBe(21_242);
    expect(byTag('COLR')?.payloadLength).toBe(142);
    expect(byTag('DRUM')?.payloadLength).toBe(0);
    expect(byTag('WINI')?.payloadLength).toBe(42);
  });

  it('repete a contagem de sistemas em PAGE +2 e +12', () => {
    const found = readChunkChain(sample, 0x930);
    const page = found.find((chunk) => chunk.tag === 'PAGE');
    const view = new DataView(sample.buffer, sample.byteOffset, sample.byteLength);

    expect(page).toBeDefined();
    const payload = (page?.offset ?? 0) + 8;
    expect(view.getUint32(payload + 2, true)).toBe(lines);
    expect(view.getUint32(payload + 12, true)).toBe(lines);
  });
});

describe('anomalia conhecida: MEAS mínimo', () => {
  it('lê sem erro o compasso de 2 bytes da amostra justica (0x261E)', () => {
    const sample = readSample('justica-flauta2.enc');
    const measures = readChunkChain(sample, 0x930).filter((chunk) => chunk.tag === 'MEAS');

    expect(measures).toHaveLength(38);
    expect(measures[33]?.offset).toBe(0x261e);
    expect(measures[33]?.payloadLength).toBe(2);
    expect(measures[33]?.endOffset).toBe(0x265e);
  });
});

const CONTROLLED_DIR = 'tests/fixtures/controlled';
const CONTROLLED = readdirSync(CONTROLLED_DIR).filter((file) => file.endsWith('.enc'));

describe.each(CONTROLLED)('amostra controlada — %s', (file) => {
  const sample = new Uint8Array(readFileSync(`${CONTROLLED_DIR}/${file}`));

  it('fecha a cadeia no fim do arquivo, depois de um TK00 por parte', () => {
    const located = locateChunkChain(sample);

    expect(located.startOffset).toBe(0xc2 + (sample[0x32] ?? 0) * 0x86e);
    expect(located.endsAtFileEnd).toBe(true);
  });
});

describe('múltiplas partes', () => {
  it('desloca o primeiro bloco em um TK00 por parte', () => {
    const sample = new Uint8Array(readFileSync(`${CONTROLLED_DIR}/controle-11-duas-partes.enc`));

    expect(sample[0x32]).toBe(2);
    expect(locateChunkChain(sample).startOffset).toBe(0x119e);
  });
});

// Evidência do portão G1: o spike confere cada evento com o MusicXML exportado pelo Encore. Toda
// amostra controlada que tiver referência com o mesmo nome-base entra sozinha.
const CHECKED = [
  ...SAMPLES.map(({ file }) => `tests/fixtures/samples/${file}`),
  ...CONTROLLED.map((file) => `${CONTROLLED_DIR}/${file}`),
].filter((path) => existsSync(referenceOf(path)));

function referenceOf(path: string): string {
  return `tests/fixtures/reference/${basename(path, '.enc')}.xml`;
}

describe.each(CHECKED)('spike contra a referência — %s', (path) => {
  it('confere compassos, notas, pausas, clave, armadura, barras, vozes e quiálteras', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/enc-spike.mjs', path, '--check', referenceOf(path)],
      { encoding: 'utf8' },
    );

    expect(output).toContain('referência: confere');
  });
});

describe('readChunkChain', () => {
  it('devolve vazio quando não há tag válida', () => {
    expect(readChunkChain(new Uint8Array(64), 0)).toEqual([]);
  });

  it('recusa bloco que ultrapassa o arquivo', () => {
    const data = new Uint8Array(16);
    data.set([0x4d, 0x45, 0x41, 0x53], 0); // "MEAS"
    data.set([0xff, 0xff, 0xff, 0xff], 4); // tamanho absurdo

    expect(() => readChunkChain(data, 0)).toThrow(/além do arquivo/i);
  });
});
