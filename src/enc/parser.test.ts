import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readReferenceXml, type ReferenceScore } from '../../scripts/enc-spike.mjs';
import { generateMusicXml } from '../musicxml';
import { parseEncore } from './parser';
import { EncoreFormatError } from './types';

const DIRS = ['tests/fixtures/samples', 'tests/fixtures/controlled'];
const referenceOf = (path: string) => `tests/fixtures/reference/${basename(path, '.enc')}.xml`;
const CHECKED = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.enc'))
    .map((file) => `${dir}/${file}`),
).filter((path) => existsSync(referenceOf(path)));

const readBytes = (path: string) => new Uint8Array(readFileSync(path));

/** O Encore exporta em UTF-16LE; exportações antigas vieram em UTF-8. */
function readXml(path: string): string {
  const bytes = readFileSync(path);
  return bytes.toString(bytes[1] === 0 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, '');
}

/** O Encore exporta a pausa de compasso vazio sem `<voice>`. */
const isMeasureRest = (event: Record<string, unknown>) =>
  event.kind === 'rest' && event.type === 'whole' && event.tick === 0;

function comparable(score: ReferenceScore) {
  return {
    ...score,
    measures: score.measures.map((measure) => ({
      ...measure,
      events: measure.events.map((event) => {
        if (!isMeasureRest(event)) return event;
        return Object.fromEntries(Object.entries(event).filter(([key]) => key !== 'voice'));
      }),
    })),
  };
}

// Portão G2: `.enc` → modelo → MusicXML confere com o MusicXML exportado pelo Encore.
describe.each(CHECKED)('parser contra a referência — %s', (path) => {
  it('gera MusicXML com os mesmos compassos, notas, pausas, claves e armaduras', () => {
    const { score } = parseEncore(readBytes(path));
    // 240 por semínima, como o Encore, para comparar os ticks.
    const generated = readReferenceXml(generateMusicXml(score, { divisions: 240 }));
    const expected = readReferenceXml(readXml(referenceOf(path)));

    expect(comparable(generated)).toEqual(comparable(expected));
  });
});

describe('parseEncore', () => {
  const sample = readBytes('tests/fixtures/controlled/controle-02-c4-seminima.enc');

  it('recusa arquivo que não é do Encore', () => {
    expect(() => parseEncore(new Uint8Array(512))).toThrow(EncoreFormatError);
  });

  it('recusa outra versão do Encore com código próprio', () => {
    const other = sample.slice();
    other[4] = 0xc2;

    expect(() => parseEncore(other)).toThrow(
      expect.objectContaining({ code: 'unsupported-version' }),
    );
  });

  it('recusa arquivo truncado', () => {
    expect(() => parseEncore(sample.slice(0, sample.length - 10))).toThrow(EncoreFormatError);
  });

  it('avisa, sem falhar, o que ainda não exibe', () => {
    const { warnings } = parseEncore(readBytes('tests/fixtures/samples/justica-flauta2.enc'));

    // 0x30: ligaduras de expressão.
    expect(warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(['event-48']));
  });
});
