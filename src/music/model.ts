/**
 * Modelo musical neutro.
 *
 * Não conhece o Encore nem o MusicXML: o parser `.enc` produz este modelo e o
 * gerador MusicXML o consome. Trocar entrada ou saída mexe em um módulo só (RNF-05).
 */

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd' | '64th';

/** Pontos de aumento. Ausente equivale a 0. */
export type Dots = 0 | 1 | 2;

export interface Pitch {
  readonly step: Step;
  /** Oitava científica: C4 é o dó central. */
  readonly octave: number;
  /** Semitons de alteração: -2 (dobrado bemol) a +2 (dobrado sustenido). Ausente equivale a 0. */
  readonly alter?: -2 | -1 | 0 | 1 | 2;
}

export interface NoteDuration {
  readonly value: NoteValue;
  readonly dots?: Dots;
}

export interface Note {
  readonly type: 'note';
  readonly pitch: Pitch;
  readonly duration: NoteDuration;
  /** Pauta (1 = superior). Ausente equivale a 1. */
  readonly staff?: number;
  readonly tie?: 'start' | 'stop' | 'continue';
}

export interface Rest {
  readonly type: 'rest';
  readonly duration: NoteDuration;
  readonly staff?: number;
}

export type MusicEvent = Note | Rest;

export interface Voice {
  /** Identificador estável dentro do compasso ("1", "2", ...). */
  readonly id: string;
  readonly events: readonly MusicEvent[];
}

export interface KeySignature {
  /** Posição na roda das quintas: -7 (7 bemóis) a +7 (7 sustenidos). */
  readonly fifths: number;
  readonly mode?: 'major' | 'minor';
}

export interface TimeSignature {
  readonly beats: number;
  readonly beatType: number;
}

export type ClefSign = 'G' | 'F' | 'C';

export interface Clef {
  readonly sign: ClefSign;
  readonly line: number;
  readonly octaveChange?: number;
}

export interface MeasureAttributes {
  readonly key?: KeySignature;
  readonly time?: TimeSignature;
  /** Uma clave por pauta, na ordem das pautas. */
  readonly clefs?: readonly Clef[];
}

export interface Measure {
  /** Número do compasso como aparece na partitura (começa em 1). */
  readonly number: number;
  /** Presente só quando algo muda em relação ao compasso anterior. */
  readonly attributes?: MeasureAttributes;
  readonly voices: readonly Voice[];
}

export interface Part {
  readonly id: string;
  readonly name: string;
  readonly measures: readonly Measure[];
}

export interface Score {
  readonly title?: string;
  readonly composer?: string;
  readonly parts: readonly Part[];
}
