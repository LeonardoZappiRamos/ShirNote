import { describe, expect, it } from 'vitest';

import {
  filterScores,
  formatUpdatedAt,
  kindLabel,
  sortScores,
  titleFromFileName,
  transpositionLabel,
} from './format';
import type { ScoreSummary } from './types';

function score(
  overrides: Partial<ScoreSummary> & Pick<ScoreSummary, 'id' | 'title'>,
): ScoreSummary {
  return {
    composer: null,
    kind: 'enc',
    pageCount: null,
    transposition: 0,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('título a partir do arquivo', () => {
  it('remove diretório e extensão', () => {
    expect(titleFromFileName('C:\\acervo\\Justica Flauta.enc')).toBe('Justica Flauta');
    expect(titleFromFileName('/home/ben/partituras/hino.musicxml')).toBe('hino');
  });

  it('mantém nomes sem extensão e apara espaços', () => {
    expect(titleFromFileName('  ensaio de domingo  ')).toBe('ensaio de domingo');
  });

  it('tem fallback para nome vazio', () => {
    expect(titleFromFileName('.enc')).toBe('Partitura sem título');
  });
});

describe('busca e ordenação da biblioteca', () => {
  const scores = [
    score({ id: 'a', title: 'Águas Profundas', composer: 'Benjamim' }),
    score({ id: 'b', title: 'Cordeiro', composer: null, updatedAt: '2026-02-01T10:00:00.000Z' }),
    score({ id: 'c', title: 'Bondade', composer: 'Almir', updatedAt: '2026-03-01T10:00:00.000Z' }),
  ];

  it('busca no título e no autor sem diferenciar maiúsculas', () => {
    expect(filterScores(scores, 'benjamim').map((item) => item.id)).toEqual(['a']);
    expect(filterScores(scores, 'ÁGUAS').map((item) => item.id)).toEqual(['a']);
    expect(filterScores(scores, '  almir ').map((item) => item.id)).toEqual(['c']);
  });

  it('devolve a lista original com busca vazia', () => {
    expect(filterScores(scores, '   ')).toBe(scores);
  });

  it('ordena por mais recente sem alterar o array recebido', () => {
    const sorted = sortScores(scores, 'recent');
    expect(sorted.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    expect(scores.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('ordena por título respeitando acentos do português', () => {
    expect(sortScores(scores, 'title').map((item) => item.title)).toEqual([
      'Águas Profundas',
      'Bondade',
      'Cordeiro',
    ]);
  });
});

describe('rótulos da biblioteca', () => {
  it('descreve a transposição', () => {
    expect(transpositionLabel(0)).toBe('Tom original');
    expect(transpositionLabel(1)).toBe('+1 semitom');
    expect(transpositionLabel(-2)).toBe('-2 semitons');
  });

  it('traduz o tipo do arquivo', () => {
    expect(kindLabel('enc')).toBe('Encore');
    expect(kindLabel('musicxml')).toBe('MusicXML');
    expect(kindLabel('pdf')).toBe('PDF');
  });

  it('formata a data e ignora valor inválido', () => {
    expect(formatUpdatedAt('2026-11-04T12:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/2026$/);
    expect(formatUpdatedAt('não é data')).toBe('');
  });
});
