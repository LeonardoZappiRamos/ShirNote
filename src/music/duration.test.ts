import { describe, expect, it } from 'vitest';
import {
  divisionsFor,
  durationInDivisions,
  durationToQuarters,
  fraction,
  leastCommonMultiple,
  timeSignatureInQuarters,
  voiceDurationInQuarters,
} from './duration';
import type { Measure, Score } from './model';
import { firstMeasureAttributes, measure, note, rest, scoreOf, voice } from '../test-utils/scores';

describe('durationToQuarters', () => {
  it('converte figuras simples', () => {
    expect(durationToQuarters({ value: 'whole' })).toEqual({ numerator: 4, denominator: 1 });
    expect(durationToQuarters({ value: 'quarter' })).toEqual({ numerator: 1, denominator: 1 });
    expect(durationToQuarters({ value: '16th' })).toEqual({ numerator: 1, denominator: 4 });
  });

  it('aplica pontos de aumento', () => {
    expect(durationToQuarters({ value: 'half', dots: 1 })).toEqual({
      numerator: 3,
      denominator: 1,
    });
    expect(durationToQuarters({ value: 'quarter', dots: 2 })).toEqual({
      numerator: 7,
      denominator: 4,
    });
  });
});

describe('fraction', () => {
  it('reduz e normaliza o sinal', () => {
    expect(fraction(6, 4)).toEqual({ numerator: 3, denominator: 2 });
    expect(fraction(3, -6)).toEqual({ numerator: -1, denominator: 2 });
  });

  it('rejeita denominador zero', () => {
    expect(() => fraction(1, 0)).toThrow(/denominador zero/i);
  });
});

describe('leastCommonMultiple', () => {
  it('calcula o MMC de denominadores', () => {
    expect(leastCommonMultiple(1, 4)).toBe(4);
    expect(leastCommonMultiple(4, 16)).toBe(16);
    expect(leastCommonMultiple(2, 3)).toBe(6);
  });
});

describe('divisionsFor', () => {
  it('usa o menor divisor que representa todas as durações', () => {
    const score: Score = scoreOf([
      measure(
        1,
        [voice('1', [note('C', 4, '16th'), note('D', 4, 'eighth', { dots: 1 })])],
        firstMeasureAttributes(),
      ),
    ]);
    expect(divisionsFor(score)).toBe(4);
  });

  it('desce até 64 avos quando necessário', () => {
    const score: Score = scoreOf([measure(1, [voice('1', [note('C', 4, '64th')])])]);
    expect(divisionsFor(score)).toBe(16);
  });

  it('é 1 para partitura sem eventos', () => {
    expect(divisionsFor(scoreOf([measure(1, [])]))).toBe(1);
  });
});

describe('durationInDivisions', () => {
  it('converte para divisions', () => {
    expect(durationInDivisions({ value: 'quarter' }, 4)).toBe(4);
    expect(durationInDivisions({ value: 'eighth', dots: 1 }, 4)).toBe(3);
  });

  it('recusa divisions insuficiente', () => {
    expect(() => durationInDivisions({ value: '16th' }, 2)).toThrow(/divisions/i);
  });
});

describe('voiceDurationInQuarters', () => {
  it('soma a voz inteira', () => {
    const measureWithRest: Measure = measure(1, [
      voice('1', [note('C', 4, 'half'), rest('quarter'), note('E', 4, 'quarter')]),
    ]);
    expect(voiceDurationInQuarters(measureWithRest, 0)).toEqual({
      numerator: 4,
      denominator: 1,
    });
  });
});

describe('timeSignatureInQuarters', () => {
  it('converte a fórmula em semínimas', () => {
    expect(timeSignatureInQuarters({ beats: 4, beatType: 4 })).toEqual({
      numerator: 4,
      denominator: 1,
    });
    expect(timeSignatureInQuarters({ beats: 3, beatType: 8 })).toEqual({
      numerator: 3,
      denominator: 2,
    });
  });
});
