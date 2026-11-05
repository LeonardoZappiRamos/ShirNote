import { describe, expect, it } from 'vitest';

import {
  canAddScore,
  canEditMetadata,
  canExport,
  canSync,
  canTranspose,
  FREE_SCORE_LIMIT,
  freeLimitMessage,
  isPro,
  proFeatureMessage,
  remainingSlots,
} from './plan';

describe('limite do plano grátis (RFM-13)', () => {
  it('aceita importar enquanto há vaga', () => {
    for (let count = 0; count < FREE_SCORE_LIMIT; count += 1) {
      expect(canAddScore('free', count)).toBe(true);
    }
  });

  it('bloqueia o nono item no plano grátis', () => {
    expect(canAddScore('free', FREE_SCORE_LIMIT)).toBe(false);
    expect(canAddScore('free', FREE_SCORE_LIMIT + 10)).toBe(false);
  });

  it('não bloqueia itens já existentes acima do limite', () => {
    expect(remainingSlots('free', FREE_SCORE_LIMIT + 2)).toBe(0);
    expect(canAddScore('free', FREE_SCORE_LIMIT + 2)).toBe(false);
  });

  it('trata contagem negativa como zero', () => {
    expect(canAddScore('free', -3)).toBe(true);
    expect(remainingSlots('free', -3)).toBe(FREE_SCORE_LIMIT);
  });

  it('libera o Pro sem limite de itens', () => {
    expect(isPro('pro')).toBe(true);
    expect(canAddScore('pro', 10_000)).toBe(true);
    expect(remainingSlots('pro', 10_000)).toBeNull();
  });

  it('reserva edição, exportação e sincronização ao Pro', () => {
    expect(canTranspose('free')).toBe(false);
    expect(canEditMetadata('free')).toBe(false);
    expect(canExport('free')).toBe(false);
    expect(canSync('free')).toBe(false);

    expect(canTranspose('pro')).toBe(true);
    expect(canEditMetadata('pro')).toBe(true);
    expect(canExport('pro')).toBe(true);
    expect(canSync('pro')).toBe(true);
  });

  it('explica o recurso bloqueado antes da cobrança existir', () => {
    expect(proFeatureMessage('transpose')).toContain('Pro');
    expect(proFeatureMessage('metadata')).toContain('título e autor');
  });

  it('explica o limite citando oito partituras', () => {
    expect(freeLimitMessage()).toContain(String(FREE_SCORE_LIMIT));
    expect(freeLimitMessage()).toContain('Pro');
  });
});
