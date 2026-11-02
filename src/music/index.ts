export type {
  Clef,
  ClefSign,
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

export { simpleMelody } from './examples/simple-melody';
