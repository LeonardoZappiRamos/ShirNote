import { describe, expect, it } from 'vitest';

import { simpleMelody, transposeScore } from '../../../../src/music';
import { generateMusicXml } from '../../../../src/musicxml';
import type { ScoreRecord } from './types';
import {
  isTransposable,
  MAX_TRANSPOSITION_SEMITONES,
  transposeRecord,
  TranspositionError,
} from './transposition';

function record(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    id: 'score-1',
    title: 'Exemplo',
    composer: null,
    kind: 'enc',
    pageCount: null,
    transposition: 0,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    musicXml: '<score-partwise version="4.0" />',
    scoreJson: JSON.stringify(simpleMelody),
    fileUri: null,
    ...overrides,
  };
}

describe('transposição da partitura guardada (RFM-06)', () => {
  it('só aceita .enc com modelo neutro', () => {
    expect(isTransposable(record())).toBe(true);
    expect(isTransposable(record({ kind: 'musicxml' }))).toBe(false);
    expect(isTransposable(record({ kind: 'pdf' }))).toBe(false);
    expect(isTransposable(record({ scoreJson: null }))).toBe(false);
    expect(isTransposable(record({ scoreJson: '' }))).toBe(false);
  });

  it('sobe um semitom corrigindo a armadura', () => {
    const result = transposeRecord(record(), 1);

    expect(result.transposition).toBe(1);
    // Dó maior + 1 semitom = ré bemol maior (5 bemóis), não dó sustenido maior.
    expect(result.musicXml).toContain('<fifths>-5</fifths>');
    expect(result.musicXml).toContain('<step>F</step>');
  });

  it('parte sempre do modelo original e acumula o total', () => {
    const result = transposeRecord(record({ transposition: 5 }), -3);

    expect(result.transposition).toBe(2);
    expect(result.musicXml).toBe(generateMusicXml(transposeScore(simpleMelody, 2)));
  });

  it('desfazer a transposição devolve o MusicXML original', () => {
    const result = transposeRecord(record({ transposition: 3 }), -3);

    expect(result.transposition).toBe(0);
    expect(result.musicXml).toBe(generateMusicXml(simpleMelody));
  });

  it('recusa passar do limite de uma oitava', () => {
    expect(() =>
      transposeRecord(record({ transposition: MAX_TRANSPOSITION_SEMITONES }), 1),
    ).toThrow(TranspositionError);
    expect(() =>
      transposeRecord(record({ transposition: -MAX_TRANSPOSITION_SEMITONES }), -1),
    ).toThrow(TranspositionError);
  });

  it('recusa delta zero ou fracionário', () => {
    expect(() => transposeRecord(record(), 0)).toThrow(TranspositionError);
    expect(() => transposeRecord(record(), 1.5)).toThrow(TranspositionError);
  });

  it('recusa MusicXML e modelo corrompido', () => {
    expect(() => transposeRecord(record({ kind: 'musicxml' }), 1)).toThrow(TranspositionError);
    expect(() => transposeRecord(record({ scoreJson: '{' }), 1)).toThrow(TranspositionError);
    expect(() => transposeRecord(record({ scoreJson: '{"parts":[]}' }), 1)).toThrow(
      TranspositionError,
    );
  });
});
