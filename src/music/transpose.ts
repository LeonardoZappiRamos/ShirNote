import type { KeySignature, MusicEvent, Part, Pitch, Score, Step } from './model';

/**
 * Transposição por grau no modelo neutro (RFM-06). Regras e casos de validação:
 * `docs/transposicao.md`.
 *
 * Toda nota anda o mesmo intervalo: o mesmo número de graus (letras) e o mesmo número de
 * semitons. Assim cada nota mantém a sua função na escala: a terça continua terça e o acidente
 * de passagem continua acidente de passagem. O cálculo é puro e não conhece Encore, MusicXML
 * nem interface.
 */

type Alter = -2 | -1 | 0 | 1 | 2;

/**
 * Intervalo de transposição. `steps` conta graus (0 = uníssono, 1 = 2ª, 7 = 8ª) e `semitones`,
 * o tamanho real. Negativo desce. Ex.: 2ª maior acima = `{ steps: 1, semitones: 2 }`.
 */
export interface Interval {
  readonly steps: number;
  readonly semitones: number;
}

export type TransposeDirection = 'nearest' | 'up' | 'down';

export interface TransposeOptions {
  /**
   * Troca dobrado sustenido e dobrado bemol pela nota simples de mesmo som (si dobrado bemol →
   * lá). As duas grafias estão certas; a escolha é de quem lê (docs/transposicao.md, regra 7).
   */
  readonly simplifyDoubles?: boolean;
}

export const UNISON: Interval = { steps: 0, semitones: 0 };

/** Maior número de semitons que a interface oferece em cada direção (duas oitavas). */
export const MAX_TRANSPOSE_SEMITONES = 24;

export const OCTAVE: Interval = { steps: 7, semitones: 12 };

interface Candidate {
  readonly step: Step;
  readonly alter: Alter;
  readonly octave: number;
  /** Acidentes que a nota exige por escrito na armação de destino. */
  readonly written: number;
}

/** Semitons acima de dó dentro da oitava científica. */
const STEP_SEMITONES: Readonly<Record<Step, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Posição de cada letra natural na roda das quintas, com dó em 0. */
const STEP_FIFTHS: Readonly<Record<Step, number>> = {
  F: -1,
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
};

const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Ordem em que os acidentes entram na armação de clave. */
const SHARP_ORDER: readonly Step[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER: readonly Step[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/** Nomes das tonalidades por armação, de 7 bemóis (índice 0) a 7 sustenidos (índice 14). */
const MAJOR_NAMES = [
  'Dó bemol',
  'Sol bemol',
  'Ré bemol',
  'Lá bemol',
  'Mi bemol',
  'Si bemol',
  'Fá',
  'Dó',
  'Sol',
  'Ré',
  'Lá',
  'Mi',
  'Si',
  'Fá sustenido',
  'Dó sustenido',
] as const;

const MINOR_NAMES = [
  'Lá bemol',
  'Mi bemol',
  'Si bemol',
  'Fá',
  'Dó',
  'Sol',
  'Ré',
  'Lá',
  'Mi',
  'Si',
  'Fá sustenido',
  'Dó sustenido',
  'Sol sustenido',
  'Ré sustenido',
  'Lá sustenido',
] as const;

/** Qualidade pela diferença em semitons para a justa (uníssono, 4ª, 5ª, 8ª) ou a maior. */
const PERFECT_QUALITY: Readonly<Record<string, string>> = {
  '-1': 'diminuta',
  '0': 'justa',
  '1': 'aumentada',
};
const MAJOR_QUALITY: Readonly<Record<string, string>> = {
  '-2': 'diminuta',
  '-1': 'menor',
  '0': 'maior',
  '1': 'aumentada',
};

/**
 * Transpõe por semitons. O grau é escolhido pela tonalidade de destino com menos acidentes
 * (dó maior + 1 semitom = ré bemol maior, e não dó sustenido maior); depois, tudo anda por
 * esse intervalo. Devolve uma partitura nova; a original não é alterada.
 */
export function transposeScore(score: Score, semitones: number): Score {
  assertInteger(semitones);
  if (semitones === 0) return score;

  return transposeScoreByInterval(score, intervalForSemitones(semitones, firstKeyFifths(score)));
}

/** Transpõe a partitura inteira pelo intervalo, nota a nota e armação a armação. */
export function transposeScoreByInterval(
  score: Score,
  interval: Interval,
  options: TransposeOptions = {},
): Score {
  assertInteger(interval.steps);
  assertInteger(interval.semitones);
  if (isUnison(interval)) return score;

  return {
    ...score,
    parts: score.parts.map((part) => transposePart(part, interval, options)),
  };
}

/** Soma dois intervalos (ex.: 2ª maior acima + 8ª abaixo = 7ª menor abaixo). */
export function addIntervals(a: Interval, b: Interval): Interval {
  return { steps: a.steps + b.steps, semitones: a.semitones + b.semitones };
}

/**
 * Intervalo que leva a armação `fromFifths` até `toFifths`. `nearest` escolhe o caminho mais
 * curto; no empate (trítono), sobe.
 */
export function intervalBetweenKeys(
  fromFifths: number,
  toFifths: number,
  direction: TransposeDirection = 'nearest',
): Interval {
  assertInteger(fromFifths);
  assertInteger(toFifths);

  const delta = toFifths - fromFifths;
  const steps = mod(4 * delta, 7);
  // Cada quinta sobe 4 graus; a cada 7 quintas a mesma letra ganha um sustenido.
  let semitones = STEP_SEMITONES[stepAt(steps)] + Math.floor((delta + 1) / 7);
  let upSteps = steps;
  if (semitones < 0) {
    // Só dó bemol a partir de dó: o uníssono diminuto vira 8ª diminuta para cima.
    upSteps += 7;
    semitones += 12;
  }

  const up: Interval = { steps: upSteps, semitones };
  if (isUnison(up)) return UNISON;

  const down: Interval = { steps: up.steps - 7, semitones: up.semitones - 12 };
  if (direction === 'up') return up;
  if (direction === 'down') return down;
  return up.semitones <= 6 ? up : down;
}

/** Intervalo usado por `transposeScore` para `semitones` a partir da armação `keyFifths`. */
export function intervalForSemitones(semitones: number, keyFifths = 0): Interval {
  assertInteger(semitones);
  if (semitones === 0) return UNISON;

  const target = normalizeFifths(keyFifths + 7 * semitones, semitones);
  const base = intervalBetweenKeys(keyFifths, target, 'up');
  const octaves = Math.round((semitones - base.semitones) / 12);

  return { steps: base.steps + 7 * octaves, semitones: base.semitones + 12 * octaves };
}

/** Quantas quintas o intervalo anda na roda (2ª maior = +2, 3ª menor = -3). */
export function intervalFifths(interval: Interval): number {
  const moved = moveByInterval({ step: 'C', octave: 4 }, interval);
  return STEP_FIFTHS[moved.step] + 7 * moved.alter;
}

/** Converte a altura para a escala MIDI (dó central = 60). */
export function pitchToMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + STEP_SEMITONES[pitch.step] + (pitch.alter ?? 0);
}

/**
 * Transpõe uma altura pelo intervalo, mantendo o grau. Se a grafia exigir mais que um dobrado
 * sustenido ou bemol, a nota é reescrita na armação `keyFifths` (ver `spellPitch`). Com
 * `simplifyDoubles`, o dobrado também é reescrito, só com acidentes simples.
 */
export function transposePitch(
  pitch: Pitch,
  interval: Interval,
  keyFifths = 0,
  options: TransposeOptions = {},
): Pitch {
  const moved = moveByInterval(pitch, interval);
  const limit = options.simplifyDoubles ? 1 : 2;
  if (Math.abs(moved.alter) > limit) {
    const midi = pitchToMidi(pitch) + interval.semitones;
    return spellPitch(midi, keyFifths, interval.semitones, limit);
  }

  return moved.alter === 0
    ? { step: moved.step, octave: moved.octave }
    : { step: moved.step, octave: moved.octave, alter: moved.alter as Alter };
}

/**
 * Transpõe a armação de clave por semitons, normalizada para a grafia com menos acidentes
 * (dó maior + 1 semitom = ré bemol maior, e não dó sustenido maior).
 */
export function transposeKey(key: KeySignature, semitones: number): KeySignature {
  assertInteger(semitones);
  if (semitones === 0) return key;

  return { ...key, fifths: normalizeFifths(key.fifths + 7 * semitones, semitones) };
}

/**
 * Escreve uma altura MIDI na armação de destino, sem saber o grau de origem. Só é usada quando
 * o grau exigiria um acidente triplo.
 *
 * Entre as grafias enarmônicas possíveis, prefere a que usa a letra diatônica da
 * tonalidade e exige menos acidentes; no empate, segue a direção da armação (sustenidos
 * em tonalidades de sustenidos, bemóis em tonalidades de bemóis).
 */
export function spellPitch(
  midi: number,
  keyFifths: number,
  semitones = 0,
  maxAlter: 1 | 2 = 2,
): Pitch {
  const pitchClass = mod(midi, 12);
  const preferSharp = keyFifths > 0 || (keyFifths === 0 && semitones >= 0);

  const candidates: Candidate[] = [];
  for (const step of STEPS) {
    for (let alter = -maxAlter; alter <= maxAlter; alter += 1) {
      if (mod(STEP_SEMITONES[step] + alter, 12) !== pitchClass) continue;

      const octave = (midi - STEP_SEMITONES[step] - alter) / 12 - 1;
      if (!Number.isInteger(octave)) continue;

      const keyAlter = keyAlteration(step, keyFifths);
      candidates.push({
        step,
        alter: alter as Alter,
        octave,
        written: Math.abs(alter - keyAlter),
      });
    }
  }

  candidates.sort((a, b) => {
    return (
      a.written - b.written ||
      Math.abs(a.alter) - Math.abs(b.alter) ||
      directionCost(a.alter, preferSharp) - directionCost(b.alter, preferSharp) ||
      STEPS.indexOf(a.step) - STEPS.indexOf(b.step)
    );
  });

  const best = candidates[0];
  if (!best) {
    throw new RangeError(
      `Não foi possível escrever a altura MIDI ${midi} na armação de ${keyFifths} quintas.`,
    );
  }

  return best.alter === 0
    ? { step: best.step, octave: best.octave }
    : { step: best.step, octave: best.octave, alter: best.alter };
}

/** Nome da tonalidade em pt-BR. Sem modo (o Encore não grava), mostra a maior e a relativa. */
export function keyName(key: KeySignature): string {
  const index = Math.max(-7, Math.min(7, key.fifths)) + 7;
  const major = `${MAJOR_NAMES[index] ?? 'Dó'} maior`;
  const minor = `${MINOR_NAMES[index] ?? 'Lá'} menor`;

  if (key.mode === 'major') return major;
  if (key.mode === 'minor') return minor;
  return `${major} / ${minor}`;
}

/** Nome do intervalo em pt-BR, como o músico fala: "2ª maior acima", "3ª menor abaixo". */
export function intervalName(interval: Interval): string {
  if (isUnison(interval)) return 'Tom original';

  const steps = Math.abs(interval.steps);
  const semitones = Math.abs(interval.semitones);
  const simple = steps % 7;
  const reference = STEP_SEMITONES[stepAt(simple)] + 12 * Math.floor(steps / 7);
  const difference = semitones - reference;
  const perfect = simple === 0 || simple === 3 || simple === 4;
  const quality = (perfect ? PERFECT_QUALITY : MAJOR_QUALITY)[String(difference)];

  const direction = interval.semitones < 0 || interval.steps < 0 ? 'abaixo' : 'acima';
  if (!quality) return `${semitones} semitons ${direction}`;

  if (steps === 0) {
    const masculine = quality.replace(/a$/, 'o');
    return `Uníssono ${masculine} ${direction}`;
  }

  return `${steps + 1}ª ${quality} ${direction}`;
}

/** Armação da primeira parte no primeiro compasso que a declara; sem armação, dó maior. */
export function firstKeyFifths(score: Score): number {
  for (const measure of score.parts[0]?.measures ?? []) {
    const key = measure.attributes?.key;
    if (key) return key.fifths;
  }
  return 0;
}

function transposePart(part: Part, interval: Interval, options: TransposeOptions): Part {
  const shift = intervalFifths(interval);
  let fifths = shift;
  let segment = interval;

  const measures = part.measures.map((measure) => {
    const key = measure.attributes?.key;
    let attributes = measure.attributes;

    if (key) {
      // Uma armação além de 7 acidentes (sol sustenido maior) é escrita na enarmônica
      // (lá bemol maior): o intervalo do trecho ganha ou perde um grau, com o mesmo som.
      fifths = key.fifths + shift;
      segment = interval;
      if (fifths > 7) {
        fifths -= 12;
        segment = { steps: interval.steps + 1, semitones: interval.semitones };
      } else if (fifths < -7) {
        fifths += 12;
        segment = { steps: interval.steps - 1, semitones: interval.semitones };
      }
      attributes = { ...(measure.attributes ?? {}), key: { ...key, fifths } };
    }

    return {
      ...measure,
      attributes,
      voices: measure.voices.map((voice) => ({
        ...voice,
        events: voice.events.map((event) => transposeEvent(event, segment, fifths, options)),
      })),
    };
  });

  return { ...part, measures };
}

function transposeEvent(
  event: MusicEvent,
  interval: Interval,
  fifths: number,
  options: TransposeOptions,
): MusicEvent {
  if (event.type !== 'note') return event;
  return { ...event, pitch: transposePitch(event.pitch, interval, fifths, options) };
}

/** Anda o grau e acerta o acidente pelo tamanho real; o acidente pode passar de ±2. */
function moveByInterval(
  pitch: Pitch,
  interval: Interval,
): { step: Step; octave: number; alter: number } {
  const index = STEPS.indexOf(pitch.step) + interval.steps;
  const step = stepAt(mod(index, 7));
  const octave = pitch.octave + Math.floor(index / 7);
  const alter = pitchToMidi(pitch) + interval.semitones - pitchToMidi({ step, octave });

  return { step, octave, alter };
}

function keyAlteration(step: Step, fifths: number): Alter {
  if (fifths > 0) return SHARP_ORDER.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
}

/** Normaliza para -7..+7 (a mesma tonalidade sobe 12 quintas). */
function normalizeFifths(raw: number, semitones: number): number {
  const remainder = mod(raw, 12);
  const candidates = [remainder, remainder - 12].filter((value) => value >= -7 && value <= 7);

  return candidates.reduce((a, b) => {
    const distanceA = Math.abs(a);
    const distanceB = Math.abs(b);
    if (distanceA !== distanceB) return distanceA < distanceB ? a : b;
    // 6 quintas é o único empate (fá sustenido maior × sol bemol maior).
    return semitones >= 0 ? Math.max(a, b) : Math.min(a, b);
  });
}

function directionCost(alter: Alter, preferSharp: boolean): number {
  if (alter === 0) return 0;
  return alter > 0 === preferSharp ? 0 : 1;
}

function isUnison(interval: Interval): boolean {
  return interval.steps === 0 && interval.semitones === 0;
}

function stepAt(index: number): Step {
  const step = STEPS[index];
  if (!step) throw new RangeError(`Grau fora da escala: ${index}.`);
  return step;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function assertInteger(value: number): void {
  if (!Number.isInteger(value)) {
    throw new RangeError('A transposição precisa ser um número inteiro de semitons.');
  }
}
