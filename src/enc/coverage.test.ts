import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Measure, MusicEvent, Score } from '../music';
import { parseEncore } from './parser';

const PATHS = ['tests/fixtures/samples', 'tests/fixtures/controlled'].flatMap((dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.enc'))
    .map((file) => `${dir}/${file}`),
);

const SCORES = PATHS.map((path) => ({
  path,
  score: parseEncore(new Uint8Array(readFileSync(path))).score,
}));

const measuresOf = (score: Score) => score.parts.flatMap((part) => part.measures);
const eventsOf = (score: Score) =>
  measuresOf(score).flatMap((measure) => measure.voices.flatMap((voice) => voice.events));
const anyMeasure = (test: (measure: Measure) => boolean) => (score: Score) =>
  measuresOf(score).some(test);
const anyEvent = (test: (event: MusicEvent) => boolean) => (score: Score) =>
  eventsOf(score).some(test);
const clefs = (score: Score) =>
  measuresOf(score).flatMap((measure) => measure.attributes?.clefs ?? []);

/**
 * RNF-06 (tarefa 4.1): cada recurso suportado aparece em ao menos um `.enc` versionado. A fidelidade
 * de cada um é conferida contra o MusicXML do Encore em `parser.test.ts`; este censo só garante que
 * nenhum recurso fica sem amostra se uma fixture sair.
 */
const FEATURES: Readonly<Record<string, (score: Score) => boolean>> = {
  'RF-04 título': (score) => Boolean(score.title),
  'RF-04 autor': (score) => Boolean(score.composer),
  'RF-05 armadura com sustenido': anyMeasure(
    (measure) => (measure.attributes?.key?.fifths ?? 0) > 0,
  ),
  'RF-05 armadura com bemol': anyMeasure((measure) => (measure.attributes?.key?.fifths ?? 0) < 0),
  'RF-05 troca de fórmula': anyMeasure(
    (measure) => measure.number > 1 && !!measure.attributes?.time,
  ),
  'RF-05 troca de clave': anyMeasure(
    (measure) => measure.number > 1 && !!measure.attributes?.clefs,
  ),
  'RF-05 clave de sol': (score) => clefs(score).some((c) => c.sign === 'G' && !c.octaveChange),
  'RF-05 clave de sol oitavada': (score) =>
    clefs(score).some((c) => c.sign === 'G' && !!c.octaveChange),
  'RF-05 clave de fá': (score) => clefs(score).some((c) => c.sign === 'F'),
  'RF-05 clave de dó na 3ª linha': (score) =>
    clefs(score).some((c) => c.sign === 'C' && c.line === 3),
  'RF-05 clave de dó na 4ª linha': (score) =>
    clefs(score).some((c) => c.sign === 'C' && c.line === 4),
  'RF-06 nota': anyEvent((event) => event.type === 'note'),
  'RF-06 pausa': anyEvent((event) => event.type === 'rest'),
  'RF-06 sustenido': anyEvent((event) => event.type === 'note' && (event.pitch.alter ?? 0) > 0),
  'RF-06 bemol': anyEvent((event) => event.type === 'note' && (event.pitch.alter ?? 0) < 0),
  'RF-06 ponto de aumento': anyEvent((event) => (event.duration.dots ?? 0) > 0),
  'RF-06 tercina': anyEvent((event) => event.duration.tuplet?.actual === 3),
  'RF-06 acorde': anyEvent((event) => event.type === 'note' && !!event.chord),
  'RF-06 ligadura de valor': anyEvent((event) => event.type === 'note' && !!event.tie),
  'RF-06 barra de colcheia': anyEvent((event) => event.type === 'note' && !!event.beam),
  'RF-07 duas partes': (score) => score.parts.length > 1,
  'RF-07 duas pautas': (score) => score.parts.some((part) => (part.staves ?? 1) > 1),
  'RF-07 segunda voz': anyMeasure((measure) => measure.voices.length > 1),
  'barra de início de repetição': anyMeasure((measure) => !!measure.barline?.repeatStart),
  'barra de fim de repetição': anyMeasure((measure) => measure.barline?.end === 'repeat'),
  'barra final': anyMeasure((measure) => measure.barline?.end === 'final'),
  'barra dupla': anyMeasure((measure) => measure.barline?.end === 'double'),
  segno: anyMeasure((measure) => !!measure.directions?.some((d) => d.symbol === 'segno')),
  coda: anyMeasure((measure) => !!measure.directions?.some((d) => d.symbol === 'coda')),
};

describe('cobertura de fixtures por recurso (RNF-06)', () => {
  it.each(Object.entries(FEATURES))('%s tem ao menos um .enc', (_, has) => {
    expect(SCORES.filter(({ score }) => has(score)).map(({ path }) => path)).not.toEqual([]);
  });
});
