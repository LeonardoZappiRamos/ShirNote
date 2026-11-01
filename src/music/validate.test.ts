import { describe, expect, it } from 'vitest';
import { firstMeasureAttributes, measure, note, scoreOf, voice } from '../test-utils/scores';
import { validateScore } from './validate';

describe('validateScore', () => {
  it('não acusa nada em compasso completo', () => {
    const score = scoreOf([
      measure(
        1,
        [
          voice('1', [
            note('C', 4, 'quarter'),
            note('D', 4, 'quarter'),
            note('E', 4, 'quarter'),
            note('F', 4, 'quarter'),
          ]),
        ],
        firstMeasureAttributes(),
      ),
    ]);
    expect(validateScore(score)).toEqual([]);
  });

  it('acusa duração de compasso divergente', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'quarter'), note('D', 4, 'half')])], {
        time: { beats: 4, beatType: 4 },
      }),
    ]);
    const issues = validateScore(score);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('measure-duration-mismatch');
    expect(issues[0]?.measureNumber).toBe(1);
  });

  it('carrega a fórmula de compasso para os compassos seguintes', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'whole')])], {
        time: { beats: 4, beatType: 4 },
      }),
      measure(2, [voice('1', [note('D', 4, 'whole')])]),
    ]);
    expect(validateScore(score)).toEqual([]);
  });

  it('acusa voz duplicada no mesmo compasso', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'whole')]), voice('1', [note('E', 4, 'whole')])]),
    ]);
    expect(validateScore(score).map((issue) => issue.code)).toContain('duplicate-voice-id');
  });

  it('acusa oitava fora da faixa', () => {
    const score = scoreOf([measure(1, [voice('1', [note('C', 12, 'whole')])])]);
    expect(validateScore(score).map((issue) => issue.code)).toContain('pitch-octave-out-of-range');
  });

  it('acusa parte e compasso vazios', () => {
    const score = scoreOf([measure(1, [])]);
    const codes = validateScore(score).map((issue) => issue.code);
    expect(codes).toContain('empty-measure');

    const emptyPart = { parts: [{ id: 'P1', name: 'Piano', measures: [] }] };
    expect(validateScore(emptyPart).map((issue) => issue.code)).toContain('empty-part');
  });

  it('falha com partitura sem partes', () => {
    const issues = validateScore({ parts: [] });
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.code).toBe('empty-score');
  });
});
