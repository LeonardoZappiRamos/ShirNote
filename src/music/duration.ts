import type { Measure, NoteDuration, NoteValue, Score } from './model';

/** Fração exata, sempre reduzida e com denominador positivo. */
export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

/** Duração de cada figura em semínimas (quarter notes). */
export const NOTE_VALUE_QUARTERS: Readonly<Record<NoteValue, Fraction>> = {
  breve: { numerator: 8, denominator: 1 },
  whole: { numerator: 4, denominator: 1 },
  half: { numerator: 2, denominator: 1 },
  quarter: { numerator: 1, denominator: 1 },
  eighth: { numerator: 1, denominator: 2 },
  '16th': { numerator: 1, denominator: 4 },
  '32nd': { numerator: 1, denominator: 8 },
  '64th': { numerator: 1, denominator: 16 },
};

/** Fator de cada quantidade de pontos: 0 → 1, 1 → 3/2, 2 → 7/4. */
const DOTS_FACTORS: Readonly<Record<number, Fraction>> = {
  0: { numerator: 1, denominator: 1 },
  1: { numerator: 3, denominator: 2 },
  2: { numerator: 7, denominator: 4 },
};

export function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const rest = x % y;
    x = y;
    y = rest;
  }
  return x;
}

export function leastCommonMultiple(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / greatestCommonDivisor(a, b)) * b);
}

export function fraction(numerator: number, denominator = 1): Fraction {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error(`Fração exige inteiros: ${numerator}/${denominator}`);
  }
  if (denominator === 0) throw new Error('Fração com denominador zero.');
  const sign = denominator < 0 ? -1 : 1;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: (sign * numerator) / divisor,
    denominator: Math.abs(denominator) / divisor,
  };
}

export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return fraction(a.numerator * b.numerator, a.denominator * b.denominator);
}

export function durationToQuarters(duration: NoteDuration): Fraction {
  const base = NOTE_VALUE_QUARTERS[duration.value];
  const factor = DOTS_FACTORS[duration.dots ?? 0];
  if (!factor) throw new Error(`Quantidade de pontos não suportada: ${duration.dots}`);
  const { tuplet } = duration;
  const dotted = multiplyFractions(base, factor);
  return tuplet ? multiplyFractions(dotted, fraction(tuplet.normal, tuplet.actual)) : dotted;
}

/** Menor `divisions` (por semínima) que representa todas as durações da partitura. */
export function divisionsFor(score: Score): number {
  let divisions = 1;
  for (const part of score.parts) {
    for (const measure of part.measures) {
      for (const voice of measure.voices) {
        for (const event of voice.events) {
          const quarters = durationToQuarters(event.duration);
          divisions = leastCommonMultiple(divisions, quarters.denominator);
        }
      }
    }
  }
  return divisions;
}

export function durationInDivisions(duration: NoteDuration, divisions: number): number {
  const quarters = durationToQuarters(duration);
  const result = (quarters.numerator * divisions) / quarters.denominator;
  if (!Number.isInteger(result)) {
    throw new Error(
      `Duração ${duration.value} não é representável com divisions=${divisions} (use um MMC maior).`,
    );
  }
  return result;
}

/** Soma das durações de uma voz, em semínimas. */
export function voiceDurationInQuarters(measure: Measure, voiceIndex: number): Fraction {
  const voice = measure.voices[voiceIndex];
  if (!voice) throw new Error(`Voz ${voiceIndex} inexistente no compasso ${measure.number}.`);
  let total = fraction(0);
  for (const event of voice.events) {
    if (event.type === 'note' && event.chord) continue;
    const quarters = durationToQuarters(event.duration);
    total = fraction(
      total.numerator * quarters.denominator + quarters.numerator * total.denominator,
      total.denominator * quarters.denominator,
    );
  }
  return total;
}

/** Duração do compasso segundo a fórmula de compasso vigente. */
export function timeSignatureInQuarters(time: { beats: number; beatType: number }): Fraction {
  return fraction(time.beats * 4, time.beatType);
}
