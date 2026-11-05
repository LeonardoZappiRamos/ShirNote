/**
 * Configuração de página da impressão: papel, orientação, escala, margens e título.
 * Converte a escolha da pessoa no formato de página do OSMD e no `@page` do CSS.
 */

export type Paper = 'A4' | 'Letter';
export type Orientation = 'portrait' | 'landscape';
export type MarginSize = 'narrow' | 'normal' | 'wide';

export interface PrintSettings {
  readonly paper: Paper;
  readonly orientation: Orientation;
  /** Tamanho da notação: 1 é o padrão do OSMD; maior cabe menos compassos por página. */
  readonly scale: number;
  readonly margins: MarginSize;
  readonly showTitle: boolean;
}

export interface PrintLayout {
  /** Formato do OSMD (`A4_P`, `Letter_L`...). */
  readonly pageFormat: string;
  /** Largura da folha em px CSS (96 por polegada), usada como largura do desenho. */
  readonly widthPx: number;
  /** Margem nas unidades do OSMD, já compensada pela escala. */
  readonly marginUnits: number;
  /** Valor de `size` do `@page`. */
  readonly cssPageSize: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paper: 'A4',
  orientation: 'portrait',
  scale: 1,
  margins: 'normal',
  showTitle: true,
};

export const PRINT_SCALES: readonly number[] = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.4];

export const PAPER_LABEL: Readonly<Record<Paper, string>> = {
  A4: 'A4 (210 × 297 mm)',
  Letter: 'Carta (216 × 279 mm)',
};

export const MARGIN_LABEL: Readonly<Record<MarginSize, string>> = {
  narrow: 'Estreitas (8 mm)',
  normal: 'Normais (15 mm)',
  wide: 'Largas (25 mm)',
};

const PAPER_MM: Readonly<Record<Paper, readonly [number, number]>> = {
  A4: [210, 297],
  Letter: [215.9, 279.4],
};

const MARGIN_MM: Readonly<Record<MarginSize, number>> = { narrow: 8, normal: 15, wide: 25 };

const PX_PER_MM = 96 / 25.4;

/** O OSMD mede a página em unidades de 10 px com zoom 1 (largura do contêiner / 10 / zoom). */
const PX_PER_OSMD_UNIT = 10;

/** Altura padrão do título no OSMD, em unidades. */
const DEFAULT_TITLE_HEIGHT = 4;

/**
 * O OSMD centraliza o título sem quebrar a linha; um título longo vaza da folha. Reduz a altura
 * até caber na largura útil.
 * ponytail: largura média de 0,55 da altura por caractere; medir o texto se um título ainda vazar.
 */
export function titleHeight(title: string, settings: PrintSettings): number {
  const { widthPx, marginUnits } = printLayout(settings);
  const usable = widthPx / PX_PER_OSMD_UNIT / settings.scale - 2 * marginUnits;
  const fitting = usable / (Math.max(1, title.length) * 0.55);
  return Math.min(DEFAULT_TITLE_HEIGHT, fitting);
}

export function printLayout(settings: PrintSettings): PrintLayout {
  const [shortSide, longSide] = PAPER_MM[settings.paper];
  const portrait = settings.orientation === 'portrait';
  const widthMm = portrait ? shortSide : longSide;

  return {
    pageFormat: `${settings.paper}_${portrait ? 'P' : 'L'}`,
    // Arredonda para baixo: um pixel a mais na largura empurra a altura para uma folha extra.
    widthPx: Math.floor(widthMm * PX_PER_MM),
    marginUnits: (MARGIN_MM[settings.margins] * PX_PER_MM) / PX_PER_OSMD_UNIT / settings.scale,
    cssPageSize: `${settings.paper === 'A4' ? 'A4' : 'letter'} ${settings.orientation}`,
  };
}
