import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateXML } from 'xmllint-wasm';
import { parseEncore } from '../enc/parser';
import { simpleMelody } from '../music';
import { generateMusicXml } from './generate';

const SCHEMA_DIR = 'tests/schema';
const read = (path: string) => readFileSync(path, 'utf8');

const SAMPLES = ['tests/fixtures/samples', 'tests/fixtures/controlled'].flatMap((dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.enc'))
    .map((file) => `${dir}/${file}`),
);

// RF-08 e portão G2: o MusicXML gerado é válido contra o XSD oficial do MusicXML 4.0.
describe('MusicXML gerado contra o XSD do MusicXML 4.0', () => {
  it('valida o exemplo sintético e todas as amostras .enc', async () => {
    const xml = [
      { fileName: 'simple-melody.xml', contents: generateMusicXml(simpleMelody) },
      ...SAMPLES.map((path) => ({
        fileName: path,
        contents: generateMusicXml(parseEncore(new Uint8Array(readFileSync(path))).score),
      })),
    ];

    const result = await validate(xml);

    expect(result.errors.map((error) => error.message)).toEqual([]);
    expect(result.valid).toBe(true);
  }, 60_000);

  it('rejeita MusicXML com elemento fora de ordem', async () => {
    const broken = generateMusicXml(simpleMelody).replace(
      /<duration>(\d+)<\/duration>(\s*)<voice>/,
      '<voice>$2<duration>$1</duration>',
    );

    expect((await validate([{ fileName: 'broken.xml', contents: broken }])).valid).toBe(false);
  });
});

function validate(xml: { fileName: string; contents: string }[]) {
  return validateXML({
    xml,
    schema: [read(`${SCHEMA_DIR}/musicxml.xsd`)],
    preload: [
      { fileName: 'xml.xsd', contents: read(`${SCHEMA_DIR}/xml.xsd`) },
      { fileName: 'xlink.xsd', contents: read(`${SCHEMA_DIR}/xlink.xsd`) },
    ],
  });
}
