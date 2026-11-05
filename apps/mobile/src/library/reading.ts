/** Posição de leitura por partitura (RFM-05), guardada na tabela `settings`. */

export interface ReadingPosition {
  /** 0 é o topo da partitura e 1 é o fim. */
  readonly scrollRatio: number;
  readonly zoom: number;
}

export const MIN_READING_ZOOM = 0.5;
export const MAX_READING_ZOOM = 3;

export const DEFAULT_READING_POSITION: ReadingPosition = {
  scrollRatio: 0,
  zoom: 1,
};

const KEY_PREFIX = 'reading:';

export function readingPositionKey(scoreId: string): string {
  return `${KEY_PREFIX}${scoreId}`;
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_READING_POSITION.zoom;
  return Math.min(MAX_READING_ZOOM, Math.max(MIN_READING_ZOOM, Number(value.toFixed(2))));
}

export function clampScrollRatio(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_READING_POSITION.scrollRatio;
  return Math.min(1, Math.max(0, value));
}

/** Um valor corrompido no banco nunca impede a partitura de abrir. */
export function parseReadingPosition(raw: string | null | undefined): ReadingPosition {
  if (!raw) return DEFAULT_READING_POSITION;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_READING_POSITION;

    const record = parsed as Record<string, unknown>;
    return {
      scrollRatio:
        typeof record.scrollRatio === 'number'
          ? clampScrollRatio(record.scrollRatio)
          : DEFAULT_READING_POSITION.scrollRatio,
      zoom:
        typeof record.zoom === 'number' ? clampZoom(record.zoom) : DEFAULT_READING_POSITION.zoom,
    };
  } catch {
    return DEFAULT_READING_POSITION;
  }
}

export function serializeReadingPosition(position: ReadingPosition): string {
  return JSON.stringify({
    scrollRatio: clampScrollRatio(position.scrollRatio),
    zoom: clampZoom(position.zoom),
  });
}
