import { describe, expect, it } from 'vitest';
import { firstMeasureAttributes, measure, note, rest, scoreOf, voice } from '../test-utils/scores';
import type { Score } from './model';
import {
  OCTAVE,
  WRITTEN_FOR,
  soundingFifths,
  addIntervals,
  intervalBetweenKeys,
  intervalFifths,
  intervalForSemitones,
  intervalName,
  keyName,
  pitchToMidi,
  spellPitch,
  transposeKey,
  transposePitch,
  transposeScore,
  transposeScoreByInterval,
  type Interval,
} from './transpose';

const UNISON_CHECK: Interval = { steps: 0, semitones: 0 };
const M2_UP: Interval = { steps: 1, semitones: 2 };
const MINOR_2_DOWN: Interval = { steps: -1, semitones: -1 };
const MINOR_2_UP: Interval = { steps: 1, semitones: 1 };

function pitchAt(score: Score, measureIndex: number, eventIndex = 0, partIndex = 0) {
  const event = score.parts[partIndex]?.measures[measureIndex]?.voices[0]?.events[eventIndex];
  if (!event || event.type !== 'note') throw new Error('esperava uma nota');
  return event.pitch;
}

function keyAt(score: Score, measureIndex: number) {
  return score.parts[0]?.measures[measureIndex]?.attributes?.key;
}

function melody(notes: ReturnType<typeof note>[], fifths = 0): Score {
  return scoreOf([measure(1, [voice('1', notes)], firstMeasureAttributes({ keyFifths: fifths }))]);
}

describe('pitchToMidi', () => {
  it('usa dó central como 60', () => {
    expect(pitchToMidi({ step: 'C', octave: 4 })).toBe(60);
    expect(pitchToMidi({ step: 'A', octave: 4 })).toBe(69);
  });

  it('considera os acidentes e a oitava científica', () => {
    expect(pitchToMidi({ step: 'B', octave: 3, alter: 1 })).toBe(60);
    expect(pitchToMidi({ step: 'C', octave: 4, alter: -1 })).toBe(59);
    expect(pitchToMidi({ step: 'F', octave: 4, alter: 2 })).toBe(67);
  });
});

describe('transposeKey', () => {
  it('anda na roda das quintas', () => {
    expect(transposeKey({ fifths: 0, mode: 'major' }, 2).fifths).toBe(2);
    expect(transposeKey({ fifths: 0, mode: 'major' }, 7).fifths).toBe(1);
    expect(transposeKey({ fifths: 1, mode: 'major' }, 1).fifths).toBe(-4);
  });

  it('escolhe a grafia com menos acidentes', () => {
    expect(transposeKey({ fifths: 0, mode: 'major' }, 1).fifths).toBe(-5);
    expect(transposeKey({ fifths: 0, mode: 'major' }, -1).fifths).toBe(5);
    expect(transposeKey({ fifths: 7, mode: 'major' }, 1).fifths).toBe(2);
    expect(transposeKey({ fifths: -7, mode: 'major' }, -1).fifths).toBe(-2);
  });

  it('desempata as seis quintas pela direção', () => {
    expect(transposeKey({ fifths: 0, mode: 'major' }, 6).fifths).toBe(6);
    expect(transposeKey({ fifths: 0, mode: 'major' }, -6).fifths).toBe(-6);
  });

  it('preserva o modo e não mexe em transposição zero', () => {
    const key = { fifths: 3, mode: 'minor' } as const;
    expect(transposeKey(key, 0)).toBe(key);
    expect(transposeKey(key, 2)).toEqual({ fifths: 5, mode: 'minor' });
  });
});

describe('spellPitch', () => {
  it('escreve a nota diatônica da tonalidade', () => {
    expect(spellPitch(62, 2)).toEqual({ step: 'D', octave: 4 });
    expect(spellPitch(66, 2)).toEqual({ step: 'F', octave: 4, alter: 1 });
    expect(spellPitch(68, -5)).toEqual({ step: 'A', octave: 4, alter: -1 });
  });

  it('usa sustenido em dó maior e bemol em fá maior', () => {
    expect(spellPitch(61, 0)).toEqual({ step: 'C', octave: 4, alter: 1 });
    expect(spellPitch(61, -1)).toEqual({ step: 'D', octave: 4, alter: -1 });
  });

  it('respeita as armaduras extremas', () => {
    expect(spellPitch(60, 7)).toEqual({ step: 'B', octave: 3, alter: 1 });
    expect(spellPitch(65, 7)).toEqual({ step: 'E', octave: 4, alter: 1 });
  });
});

describe('transposePitch', () => {
  it('sobe um tom em dó maior', () => {
    expect(transposePitch({ step: 'C', octave: 4 }, M2_UP, 2)).toEqual({ step: 'D', octave: 4 });
    expect(transposePitch({ step: 'E', octave: 4 }, M2_UP, 2)).toEqual({
      step: 'F',
      octave: 4,
      alter: 1,
    });
    expect(transposePitch({ step: 'B', octave: 4 }, M2_UP, 2)).toEqual({
      step: 'C',
      octave: 5,
      alter: 1,
    });
  });

  it('desce um semitom em si maior', () => {
    expect(transposePitch({ step: 'C', octave: 4 }, MINOR_2_DOWN, 5)).toEqual({
      step: 'B',
      octave: 3,
    });
    expect(transposePitch({ step: 'E', octave: 4 }, MINOR_2_DOWN, 5)).toEqual({
      step: 'D',
      octave: 4,
      alter: 1,
    });
  });

  it('reescreve a enarmonia na armação de destino', () => {
    expect(transposePitch({ step: 'C', octave: 4 }, MINOR_2_UP, -5)).toEqual({
      step: 'D',
      octave: 4,
      alter: -1,
    });
    expect(transposePitch({ step: 'F', octave: 4 }, MINOR_2_UP, -5)).toEqual({
      step: 'G',
      octave: 4,
      alter: -1,
    });
  });
});

describe('transposeScore', () => {
  const scale = [
    note('C', 4, 'quarter'),
    note('D', 4, 'quarter'),
    note('E', 4, 'quarter'),
    note('F', 4, 'quarter'),
    note('G', 4, 'quarter'),
    note('A', 4, 'quarter'),
    note('B', 4, 'quarter'),
    note('C', 5, 'quarter'),
  ];

  it('transpõe as notas e a armação de clave', () => {
    const score = melody(scale);
    const up = transposeScore(score, 2);

    expect(keyAt(up, 0)).toEqual({ fifths: 2, mode: 'major' });
    expect(up.parts[0]?.measures[0]?.voices[0]?.events.map((event) => event.type)).toEqual(
      score.parts[0]?.measures[0]?.voices[0]?.events.map((event) => event.type),
    );
    expect(pitchAt(up, 0, 0)).toEqual({ step: 'D', octave: 4 });
    expect(pitchAt(up, 0, 2)).toEqual({ step: 'F', octave: 4, alter: 1 });
    expect(pitchAt(up, 0, 6)).toEqual({ step: 'C', octave: 5, alter: 1 });
  });

  it('não altera a partitura original', () => {
    const score = melody(scale);
    transposeScore(score, -1);

    expect(keyAt(score, 0)).toEqual({ fifths: 0, mode: 'major' });
    expect(pitchAt(score, 0, 0)).toEqual({ step: 'C', octave: 4 });
  });

  it('devolve a mesma partitura em transposição zero', () => {
    const score = melody(scale);
    expect(transposeScore(score, 0)).toBe(score);
  });

  it('rejeita semitons fracionários', () => {
    expect(() => transposeScore(melody(scale), 0.5)).toThrow(/inteiro/i);
  });

  it('preserva pausas, durações e marcações da nota', () => {
    const marked = {
      ...note('E', 4, 'eighth', { tie: 'start', staff: 2 }),
      chord: true,
      beam: 'begin',
    } as const;
    const score = scoreOf([
      measure(1, [voice('1', [rest('quarter'), marked])], firstMeasureAttributes({ keyFifths: 2 })),
    ]);

    const up = transposeScore(score, 2);
    const events = up.parts[0]?.measures[0]?.voices[0]?.events ?? [];

    expect(events[0]).toEqual(rest('quarter'));
    expect(events[1]).toMatchObject({
      type: 'note',
      pitch: { step: 'F', octave: 4, alter: 1 },
      duration: { value: 'eighth' },
      tie: 'start',
      staff: 2,
      chord: true,
      beam: 'begin',
    });
  });

  it('transpõe cada troca de armação com a sua própria tonalidade', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'whole')])], firstMeasureAttributes({ keyFifths: 0 })),
      measure(2, [voice('1', [note('F', 4, 'whole')])], { key: { fifths: 1, mode: 'major' } }),
    ]);

    const up = transposeScore(score, 1);

    expect(keyAt(up, 0)).toEqual({ fifths: -5, mode: 'major' });
    expect(keyAt(up, 1)).toEqual({ fifths: -4, mode: 'major' });
    expect(pitchAt(up, 0)).toEqual({ step: 'D', octave: 4, alter: -1 });
    expect(pitchAt(up, 1)).toEqual({ step: 'G', octave: 4, alter: -1 });
  });

  it('transpõe todas as partes e vozes', () => {
    const score: Score = {
      parts: [
        {
          id: 'P1',
          name: 'Melodia',
          measures: [measure(1, [voice('1', [note('C', 4, 'whole')])], firstMeasureAttributes())],
        },
        {
          id: 'P2',
          name: 'Baixo',
          measures: [measure(1, [voice('1', [note('C', 3, 'whole')])], firstMeasureAttributes())],
        },
      ],
    };

    const up = transposeScore(score, 2);

    expect(up.parts.map((part) => part.measures[0]?.attributes?.key?.fifths)).toEqual([2, 2]);
    expect(up.parts.map((_, partIndex) => pitchAt(up, 0, 0, partIndex))).toEqual([
      { step: 'D', octave: 4 },
      { step: 'D', octave: 3 },
    ]);
  });
});

/**
 * Casos de validação de `docs/transposicao.md`, seção 5. O ID de cada caso é o mesmo do
 * documento: quem valida a música confere a tabela; o teste garante que o código faz o mesmo.
 */
describe('transposição por grau (docs/transposicao.md)', () => {
  const name = (from: number, to: number, direction?: 'nearest' | 'up' | 'down') =>
    intervalName(intervalBetweenKeys(from, to, direction));

  it('T01 dó maior → ré maior: 2ª maior acima', () => {
    expect(intervalBetweenKeys(0, 2)).toEqual({ steps: 1, semitones: 2 });
    expect(name(0, 2)).toBe('2ª maior acima');

    const up = transposeScoreByInterval(melody(cScale()), intervalBetweenKeys(0, 2));
    expect(keyAt(up, 0)?.fifths).toBe(2);
    expect(spelled(up)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5']);
  });

  it('T02 dó maior → si bemol maior: 2ª maior abaixo', () => {
    expect(intervalBetweenKeys(0, -2)).toEqual({ steps: -1, semitones: -2 });
    expect(name(0, -2)).toBe('2ª maior abaixo');

    const down = transposeScoreByInterval(melody(cScale()), intervalBetweenKeys(0, -2));
    expect(spelled(down)).toEqual(['Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4']);
  });

  it('T03 sol maior → mi bemol maior: 3ª maior abaixo', () => {
    expect(name(1, -3)).toBe('3ª maior abaixo');

    const score = melody(
      [note('G', 4, 'quarter'), note('B', 4, 'quarter'), note('D', 5, 'quarter')],
      1,
    );
    const down = transposeScoreByInterval(score, intervalBetweenKeys(1, -3));
    expect(keyAt(down, 0)?.fifths).toBe(-3);
    expect(spelled(down)).toEqual(['Eb4', 'G4', 'Bb4']);
  });

  it('T04 dó maior → fá maior: 4ª justa acima ou 5ª justa abaixo', () => {
    expect(name(0, -1)).toBe('4ª justa acima');
    expect(name(0, -1, 'up')).toBe('4ª justa acima');
    expect(name(0, -1, 'down')).toBe('5ª justa abaixo');
    expect(intervalBetweenKeys(0, -1, 'down')).toEqual({ steps: -4, semitones: -7 });
  });

  it('T05 e T06 trítono: no empate, sobe', () => {
    expect(name(0, 6)).toBe('4ª aumentada acima');
    expect(name(0, -6)).toBe('5ª diminuta acima');
    expect(intervalBetweenKeys(0, 6).semitones).toBe(6);
  });

  it('T07 mesma tonalidade: tom original', () => {
    expect(intervalBetweenKeys(2, 2)).toEqual({ steps: 0, semitones: 0 });
    expect(name(2, 2)).toBe('Tom original');
  });

  it('T08 lá menor → mi menor: 4ª justa abaixo pelo caminho mais curto', () => {
    expect(name(0, 1)).toBe('4ª justa abaixo');
    expect(keyName({ fifths: 1, mode: 'minor' })).toBe('Mi menor');
  });

  it('T09 acidente de passagem mantém a função: dó sustenido vira ré sustenido', () => {
    const score = melody([
      note('C', 4, 'quarter', { alter: 1 }),
      note('B', 4, 'quarter', { alter: -1 }),
    ]);
    expect(spelled(transposeScoreByInterval(score, intervalBetweenKeys(0, 2)))).toEqual([
      'D#4',
      'C5',
    ]);
  });

  it('T10 dó maior → ré bemol maior: lá bemol vira si dobrado bemol', () => {
    const score = melody([
      note('A', 4, 'quarter', { alter: -1 }),
      note('F', 4, 'quarter', { alter: 1 }),
    ]);
    expect(spelled(transposeScoreByInterval(score, intervalBetweenKeys(0, -5)))).toEqual([
      'Bbb4',
      'G4',
    ]);
  });

  it('T11 a T13 semitons escolhem a armação com menos acidentes', () => {
    expect(intervalName(intervalForSemitones(1, 0))).toBe('2ª menor acima');
    expect(intervalFifths(intervalForSemitones(1, 0))).toBe(-5);
    expect(intervalName(intervalForSemitones(-1, 0))).toBe('2ª menor abaixo');
    expect(intervalFifths(intervalForSemitones(-1, 0))).toBe(5);
    expect(intervalFifths(intervalForSemitones(6, 0))).toBe(6);
    expect(intervalFifths(intervalForSemitones(-6, 0))).toBe(-6);
  });

  it('T14 doze semitons: 8ª justa, mesma armação', () => {
    expect(intervalForSemitones(12, 3)).toEqual({ steps: 7, semitones: 12 });
    expect(intervalName({ steps: 7, semitones: 12 })).toBe('8ª justa acima');
    expect(spelled(transposeScore(melody(cScale()), -12))[0]).toBe('C3');
  });

  it('T15 modulação além de 7 acidentes vira a enarmônica', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'whole')])], firstMeasureAttributes({ keyFifths: 0 })),
      measure(2, [voice('1', [note('F', 4, 'whole', { alter: 1 })])], {
        key: { fifths: 6, mode: 'major' },
      }),
    ]);

    const up = transposeScoreByInterval(score, { steps: 1, semitones: 2 });
    expect(keyAt(up, 1)?.fifths).toBe(-4);
    expect(pitchAt(up, 1)).toEqual({ step: 'A', octave: 4, alter: -1 });
  });

  it('T16 partes com armações diferentes andam o mesmo intervalo', () => {
    const score: Score = {
      parts: [
        {
          id: 'P1',
          name: 'Voz',
          measures: [measure(1, [voice('1', [note('C', 4, 'whole')])], firstMeasureAttributes())],
        },
        {
          id: 'P2',
          name: 'Clarinete',
          measures: [
            measure(
              1,
              [voice('1', [note('D', 4, 'whole')])],
              firstMeasureAttributes({ keyFifths: 2 }),
            ),
          ],
        },
      ],
    };

    const up = transposeScoreByInterval(score, intervalBetweenKeys(0, 2));
    expect(up.parts.map((part) => part.measures[0]?.attributes?.key?.fifths)).toEqual([2, 4]);
    expect(pitchAt(up, 0, 0, 1)).toEqual({ step: 'E', octave: 4 });
  });

  it('T17 acidente triplo é reescrito na armação de destino', () => {
    const triple = transposePitch(
      { step: 'E', octave: 4, alter: 2 },
      { steps: 0, semitones: 1 },
      7,
    );
    expect(triple).toEqual({ step: 'G', octave: 4 });
  });

  it('T18 simplificar dobrados: si dobrado bemol vira lá, a pedido de quem lê', () => {
    const score = melody([
      note('A', 4, 'quarter', { alter: -1 }),
      note('C', 4, 'quarter', { alter: 1 }),
    ]);
    const toDb = intervalBetweenKeys(0, -5);
    expect(spelled(transposeScoreByInterval(score, toDb))).toEqual(['Bbb4', 'D4']);
    expect(spelled(transposeScoreByInterval(score, toDb, { simplifyDoubles: true }))).toEqual([
      'A4',
      'D4',
    ]);

    const toE = intervalBetweenKeys(0, 4);
    const sharp = melody([note('A', 4, 'quarter', { alter: 1 })]);
    expect(spelled(transposeScoreByInterval(sharp, toE))).toEqual(['C##5']);
    expect(spelled(transposeScoreByInterval(sharp, toE, { simplifyDoubles: true }))).toEqual([
      'D5',
    ]);
  });

  it('T19 oitava a critério de quem toca: 2ª maior acima + 8ª abaixo = 7ª menor abaixo', () => {
    const interval = addIntervals(intervalBetweenKeys(0, 2), { steps: -7, semitones: -12 });
    expect(interval).toEqual({ steps: -6, semitones: -10 });
    expect(intervalName(interval)).toBe('7ª menor abaixo');
    expect(intervalName(addIntervals(UNISON_CHECK, OCTAVE))).toBe('8ª justa acima');
    expect(spelled(transposeScoreByInterval(melody(cScale()), interval))[0]).toBe('D3');
  });

  it('T20 partitura escrita para instrumento transpositor mostra o tom que soa', () => {
    const [concert, bFlat, eFlat, horn] = WRITTEN_FOR;
    if (!concert || !bFlat || !eFlat || !horn) throw new Error('lista de instrumentos incompleta');

    expect(soundingFifths(2, concert)).toBe(2);
    expect(soundingFifths(2, bFlat)).toBe(0);
    expect(soundingFifths(3, eFlat)).toBe(0);
    expect(soundingFifths(1, horn)).toBe(0);
    expect(soundingFifths(-6, bFlat)).toBe(4);
    expect(soundingFifths(-6, eFlat)).toBe(3);
  });

  it('dá nome às tonalidades sem modo com a maior e a relativa', () => {
    expect(keyName({ fifths: 0 })).toBe('Dó maior / Lá menor');
    expect(keyName({ fifths: -3, mode: 'major' })).toBe('Mi bemol maior');
  });
});

function cScale() {
  return (['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).map((step) => note(step, 4, 'quarter'));
}

function spelled(score: Score): string[] {
  return (score.parts[0]?.measures ?? []).flatMap((m) =>
    (m.voices[0]?.events ?? []).flatMap((event) => {
      if (event.type !== 'note') return [];
      const alter = event.pitch.alter ?? 0;
      const accidental = alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
      return [`${event.pitch.step}${accidental}${event.pitch.octave}`];
    }),
  );
}
