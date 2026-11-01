import type { Measure, MusicEvent, Note, NoteDuration, Pitch, Score, Step, Voice } from '../model';

function note(step: Step, octave: number, value: NoteDuration['value'], dots?: 1 | 2): Note {
  const duration: NoteDuration = dots === undefined ? { value } : { value, dots };
  const pitch: Pitch = { step, octave };
  return { type: 'note', pitch, duration };
}

function voice(id: string, events: readonly MusicEvent[]): Voice {
  return { id, events };
}

function measure(number: number, voices: readonly Voice[], first = false): Measure {
  if (!first) return { number, voices };
  return {
    number,
    voices,
    attributes: {
      key: { fifths: 0, mode: 'major' },
      time: { beats: 4, beatType: 4 },
      clefs: [{ sign: 'G', line: 2 }],
    },
  };
}

/**
 * Partitura sintética usada para exercitar todo o pipeline antes do parser `.enc`
 * existir: modelo → MusicXML → OSMD.
 */
export const simpleMelody: Score = {
  title: 'Exemplo — Melodia simples',
  composer: 'ShirNote',
  parts: [
    {
      id: 'P1',
      name: 'Melodia',
      measures: [
        measure(
          1,
          [
            voice('1', [
              note('E', 4, 'quarter'),
              note('E', 4, 'quarter'),
              note('F', 4, 'quarter'),
              note('G', 4, 'quarter'),
            ]),
          ],
          true,
        ),
        measure(2, [
          voice('1', [
            note('G', 4, 'quarter'),
            note('F', 4, 'quarter'),
            note('E', 4, 'quarter'),
            note('D', 4, 'quarter'),
          ]),
        ]),
        measure(3, [
          voice('1', [
            note('C', 4, 'quarter'),
            note('C', 4, 'quarter'),
            note('D', 4, 'quarter'),
            note('E', 4, 'quarter'),
          ]),
        ]),
        measure(4, [
          voice('1', [note('E', 4, 'quarter', 1), note('D', 4, 'eighth'), note('D', 4, 'half')]),
        ]),
        measure(5, [
          voice('1', [
            note('E', 4, 'quarter'),
            note('E', 4, 'quarter'),
            note('F', 4, 'quarter'),
            note('G', 4, 'quarter'),
          ]),
        ]),
        measure(6, [
          voice('1', [
            note('G', 4, 'quarter'),
            note('F', 4, 'quarter'),
            note('E', 4, 'quarter'),
            note('D', 4, 'quarter'),
          ]),
        ]),
        measure(7, [
          voice('1', [
            note('C', 4, 'quarter'),
            note('C', 4, 'quarter'),
            note('D', 4, 'quarter'),
            note('E', 4, 'quarter'),
          ]),
        ]),
        measure(8, [
          voice('1', [note('D', 4, 'quarter', 1), note('C', 4, 'eighth'), note('C', 4, 'half')]),
        ]),
      ],
    },
  ],
};
