import type {
  Clef,
  Measure,
  MeasureAttributes,
  MusicEvent,
  Note,
  NoteDuration,
  NoteValue,
  Part,
  Rest,
  Score,
  Step,
  TimeSignature,
  Voice,
} from '../music/model';

export interface NoteOptions {
  readonly dots?: 0 | 1 | 2;
  readonly alter?: -2 | -1 | 0 | 1 | 2;
  readonly tie?: 'start' | 'stop' | 'continue';
  readonly staff?: number;
}

export function note(
  step: Step,
  octave: number,
  value: NoteValue,
  options: NoteOptions = {},
): Note {
  return {
    type: 'note',
    pitch: { step, octave, ...(options.alter !== undefined ? { alter: options.alter } : {}) },
    duration: { value, ...(options.dots !== undefined ? { dots: options.dots } : {}) },
    ...(options.tie !== undefined ? { tie: options.tie } : {}),
    ...(options.staff !== undefined ? { staff: options.staff } : {}),
  };
}

export function rest(value: NoteValue, dots?: 0 | 1 | 2): Rest {
  const duration: NoteDuration = dots === undefined ? { value } : { value, dots };
  return { type: 'rest', duration };
}

export function voice(id: string, events: readonly MusicEvent[]): Voice {
  return { id, events };
}

export function measure(
  number: number,
  voices: readonly Voice[],
  attributes?: MeasureAttributes,
): Measure {
  return attributes === undefined ? { number, voices } : { number, voices, attributes };
}

export const trebleClef: Clef = { sign: 'G', line: 2 };

export const fourFour: TimeSignature = { beats: 4, beatType: 4 };

export function firstMeasureAttributes(
  options: { keyFifths?: number; clefs?: readonly Clef[] } = {},
): MeasureAttributes {
  return {
    key: { fifths: options.keyFifths ?? 0, mode: 'major' },
    time: fourFour,
    clefs: options.clefs ?? [trebleClef],
  };
}

export function scoreOf(measures: readonly Measure[], title?: string): Score {
  return {
    ...(title !== undefined ? { title } : {}),
    parts: [{ id: 'P1', name: 'Melodia', measures }],
  };
}

export function singlePart(measures: readonly Measure[], part: Partial<Part> = {}): Part {
  return { id: part.id ?? 'P1', name: part.name ?? 'Melodia', measures };
}
