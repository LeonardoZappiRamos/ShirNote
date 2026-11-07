import type { ScoreSummary } from './types';

export type LibrarySort = 'recent' | 'title';

/** Nome amigável para um arquivo sem extensão, usado quando o `.enc` não traz título. */
export function titleFromFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const withoutExtension = base.replace(/\.[^.]+$/, '').trim();
  return withoutExtension.length > 0 ? withoutExtension : 'Partitura sem título';
}

export function filterScores(
  scores: readonly ScoreSummary[],
  query: string,
): readonly ScoreSummary[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return scores;

  return scores.filter((score) => {
    const searchable = `${score.title} ${score.composer ?? ''}`.toLowerCase();
    return searchable.includes(normalized);
  });
}

/** Devolve uma cópia: a tela nunca reordena o array que veio do banco. */
export function sortScores(scores: readonly ScoreSummary[], sort: LibrarySort): ScoreSummary[] {
  const copy = [...scores];

  if (sort === 'title') {
    copy.sort((left, right) =>
      left.title.localeCompare(right.title, 'pt-BR', { sensitivity: 'base' }),
    );
  } else {
    copy.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  return copy;
}

/** Data curta em pt-BR sem depender de `Intl` no Hermes. */
export function formatUpdatedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function transpositionLabel(semitones: number): string {
  if (semitones === 0) return 'Tom original';
  const plural = Math.abs(semitones) === 1 ? 'semitom' : 'semitons';
  return `${semitones > 0 ? '+' : ''}${semitones} ${plural}`;
}

export function kindLabel(kind: ScoreSummary['kind']): string {
  switch (kind) {
    case 'enc':
      return 'Encore';
    case 'musicxml':
      return 'MusicXML';
    case 'pdf':
      return 'PDF';
  }
}
