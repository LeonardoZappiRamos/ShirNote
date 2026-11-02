import { readFileSync } from 'node:fs';
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
