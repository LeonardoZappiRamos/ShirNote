export type {
  Barline,
  Clef,
  ClefSign,
  Direction,
  Dots,
  KeySignature,
  Measure,
  MeasureAttributes,
  MusicEvent,
  Note,
  NoteDuration,
  NoteValue,
  Part,
  Pitch,
  Rest,
  Score,
  Step,
  TimeSignature,
  Tuplet,
  Voice,
} from './model';

export {
  NOTE_VALUE_QUARTERS,
  divisionsFor,
  durationInDivisions,
  durationToQuarters,
  fraction,
  greatestCommonDivisor,
  leastCommonMultiple,
  multiplyFractions,
  timeSignatureInQuarters,
  voiceDurationInQuarters,
  type Fraction,
} from './duration';

export { validateScore, type IssueSeverity, type ScoreIssue } from './validate';

export {
  MAX_TRANSPOSE_SEMITONES,
  OCTAVE,
  UNISON,
  addIntervals,
  firstKeyFifths,
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
  type TransposeDirection,
  type TransposeOptions,
} from './transpose';

export { simpleMelody } from './examples/simple-melody';
