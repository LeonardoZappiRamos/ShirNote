import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readChunkChain, locateChunkChain } from './container';

const sample = new Uint8Array(readFileSync('tests/fixtures/samples/justica-flauta2.enc'));

describe('contêiner .enc — amostra justica-flauta2', () => {
  it('encontra a cadeia que fecha exatamente no fim do arquivo', () => {
    const located = locateChunkChain(sample);

    expect(located.startOffset).toBe(0x930);
    expect(located.endsAtFileEnd).toBe(true);
    expect(located.chunks).toHaveLength(56);
  });

  it('reconhece a ordem dos blocos', () => {
    const tags = locateChunkChain(sample).chunks.map((chunk) => chunk.tag);

    expect(tags[0]).toBe('PAGE');
    expect(tags.slice(1, 11)).toEqual(Array(10).fill('LINE'));
    expect(tags.slice(11, 49)).toEqual(Array(38).fill('MEAS'));
    expect(tags.slice(49)).toEqual(['PREC', 'TITL', 'TEXT', 'FONT', 'COLR', 'DRUM', 'WINI']);
  });

  it('aplica o trailer de 54 bytes em cada MEAS', () => {
    const measures = locateChunkChain(sample).chunks.filter((chunk) => chunk.tag === 'MEAS');

    expect(measures).toHaveLength(38);
    for (const measure of measures) {
      expect(measure.trailerLength).toBe(54);
    }
  });

  it('mantém os tamanhos conhecidos da amostra', () => {
    const chunks = readChunkChain(sample, 0x930);
    const byTag = (tag: string) => chunks.find((chunk) => chunk.tag === tag);

    expect(byTag('PAGE')?.payloadLength).toBe(26);
    expect(byTag('LINE')?.payloadLength).toBe(56);
    expect(byTag('PREC')?.payloadLength).toBe(5420);
    expect(byTag('TITL')?.payloadLength).toBe(21242);
    expect(byTag('DRUM')?.payloadLength).toBe(0);
    expect(byTag('WINI')?.payloadLength).toBe(42);
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
