import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_SETTINGS, printLayout, titleHeight } from './printLayout';

describe('printLayout', () => {
  it('A4 em retrato tem a largura da folha em px CSS', () => {
    expect(printLayout(DEFAULT_PRINT_SETTINGS)).toEqual({
      pageFormat: 'A4_P',
      widthPx: 793,
      marginUnits: (15 * 96) / 25.4 / 10,
      cssPageSize: 'A4 portrait',
    });
  });

  it('carta em paisagem usa o lado maior como largura', () => {
    const layout = printLayout({
      ...DEFAULT_PRINT_SETTINGS,
      paper: 'Letter',
      orientation: 'landscape',
    });
    expect(layout.pageFormat).toBe('Letter_L');
    expect(layout.widthPx).toBe(1056);
    expect(layout.cssPageSize).toBe('letter landscape');
  });

  it('a margem continua do mesmo tamanho no papel quando a escala muda', () => {
    const normal = printLayout(DEFAULT_PRINT_SETTINGS).marginUnits;
    const bigger = printLayout({ ...DEFAULT_PRINT_SETTINGS, scale: 1.25 }).marginUnits;
    expect(bigger * 1.25).toBeCloseTo(normal);
  });
});

describe('titleHeight', () => {
  it('mantém o tamanho padrão para títulos curtos e reduz os longos', () => {
    expect(titleHeight('Hino', DEFAULT_PRINT_SETTINGS)).toBe(4);
    const long = 'A3 - A SEU TEMPO (BASE BÍBLICA DE 2000)';
    expect(titleHeight(long, DEFAULT_PRINT_SETTINGS)).toBeLessThan(4);
  });
});
