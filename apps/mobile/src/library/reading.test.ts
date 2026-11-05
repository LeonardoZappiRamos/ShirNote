import { describe, expect, it } from 'vitest';

import {
  clampScrollRatio,
  clampZoom,
  DEFAULT_READING_POSITION,
  parseReadingPosition,
  readingPositionKey,
  serializeReadingPosition,
} from './reading';

describe('posição de leitura (RFM-05)', () => {
  it('usa uma chave por partitura', () => {
    expect(readingPositionKey('abc')).toBe('reading:abc');
  });

  it('devolve o padrão quando não há nada salvo', () => {
    expect(parseReadingPosition(null)).toBe(DEFAULT_READING_POSITION);
    expect(parseReadingPosition('')).toBe(DEFAULT_READING_POSITION);
  });

  it('sobrevive a um valor corrompido', () => {
    expect(parseReadingPosition('{')).toBe(DEFAULT_READING_POSITION);
    expect(parseReadingPosition('42')).toBe(DEFAULT_READING_POSITION);
    expect(parseReadingPosition('"texto"')).toBe(DEFAULT_READING_POSITION);
  });

  it('lê a posição salva', () => {
    expect(parseReadingPosition('{"scrollRatio":0.5,"zoom":1.5}')).toEqual({
      scrollRatio: 0.5,
      zoom: 1.5,
    });
  });

  it('ignora campos com tipo errado', () => {
    expect(parseReadingPosition('{"scrollRatio":"meio","zoom":true}')).toEqual(
      DEFAULT_READING_POSITION,
    );
  });

  it('limita rolagem e zoom à faixa válida', () => {
    expect(clampScrollRatio(-1)).toBe(0);
    expect(clampScrollRatio(4)).toBe(1);
    expect(clampScrollRatio(Number.NaN)).toBe(0);

    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(9)).toBe(3);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampZoom(1.234)).toBe(1.23);
  });

  it('serializa já normalizado', () => {
    expect(serializeReadingPosition({ scrollRatio: 2, zoom: 8 })).toBe(
      '{"scrollRatio":1,"zoom":3}',
    );
  });
});
