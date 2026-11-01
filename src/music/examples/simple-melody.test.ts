import { describe, expect, it } from 'vitest';
import { divisionsFor } from '../duration';
import { simpleMelody } from './simple-melody';
import { validateScore } from '../validate';

describe('simpleMelody', () => {
  it('tem 8 compassos e passa na validação', () => {
    expect(simpleMelody.parts[0]?.measures).toHaveLength(8);
    expect(validateScore(simpleMelody)).toEqual([]);
  });

  it('usa divisions 2 (colcheia e semínima pontuada)', () => {
    expect(divisionsFor(simpleMelody)).toBe(2);
  });
});
