import { transposeScore, type Score } from '../../../../src/music';
import { generateMusicXml } from '../../../../src/musicxml';
import type { ScoreRecord } from './types';

/**
 * RFM-06: transpõe partituras importadas de `.enc`, que guardam o modelo neutro.
 * O modelo salvo é sempre o original; o total de semitons fica em `transposition`,
 * então subir e descer volta à grafia exata do arquivo.
 */
export const MAX_TRANSPOSITION_SEMITONES = 12;

export class TranspositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranspositionError';
  }
}

export interface TranspositionResult {
  readonly transposition: number;
  readonly musicXml: string;
}

export function isTransposable(
  score: Pick<ScoreRecord, 'kind' | 'scoreJson'>,
): score is Pick<ScoreRecord, 'kind' | 'scoreJson'> & { readonly scoreJson: string } {
  return score.kind === 'enc' && typeof score.scoreJson === 'string' && score.scoreJson.length > 0;
}

/**
 * Aplica `delta` semitons sobre o tom atual. MusicXML e PDF não têm modelo neutro na v1
 * (PRD móvel, seção 9) e por isso não podem ser transpostos.
 */
export function transposeRecord(score: ScoreRecord, delta: number): TranspositionResult {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new TranspositionError('A transposição precisa ser de pelo menos um semitom.');
  }

  if (!isTransposable(score)) {
    throw new TranspositionError(
      'Só partituras importadas de .enc podem ser transpostas nesta versão.',
    );
  }

  const target = score.transposition + delta;
  if (Math.abs(target) > MAX_TRANSPOSITION_SEMITONES) {
    throw new TranspositionError(
      `O limite é de ${MAX_TRANSPOSITION_SEMITONES} semitons para cima ou para baixo.`,
    );
  }

  return {
    transposition: target,
    musicXml: generateMusicXml(transposeScore(parseScore(score.scoreJson), target)),
  };
}

function parseScore(raw: string): Score {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TranspositionError('O modelo da partitura está corrompido.');
  }

  if (!isScore(parsed)) {
    throw new TranspositionError('O modelo da partitura está corrompido.');
  }

  return parsed;
}

function isScore(value: unknown): value is Score {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.parts) || candidate.parts.length === 0) return false;

  return candidate.parts.every(
    (part) =>
      typeof part === 'object' &&
      part !== null &&
      Array.isArray((part as Record<string, unknown>).measures),
  );
}
