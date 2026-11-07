import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useEffect, useId, useRef, useState } from 'react';
import {
  DEFAULT_PRINT_SETTINGS,
  MARGIN_LABEL,
  PAPER_LABEL,
  PRINT_SCALES,
  printLayout,
  titleHeight,
  type MarginSize,
  type Orientation,
  type Paper,
  type PrintSettings,
} from './printLayout';

interface PrintPanelProps {
  /** A partitura como está na tela, já transposta. */
  readonly musicXml: string | null;
  readonly label: string;
}

/**
 * Impressão em páginas. A tela desenha a partitura numa faixa contínua; aqui um segundo OSMD
 * diagrama em folhas do tamanho do papel, e o navegador imprime ou salva em PDF. O OSMD só
 * quebra entre sistemas, então nenhum compasso fica cortado entre duas folhas.
 */
export function PrintPanel({ musicXml, label }: PrintPanelProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const id = useId();

  // A classe no <body> diz ao CSS de impressão para mostrar só as folhas. Não usa `:has()`,
  // que navegadores mais antigos ignoram e acabam imprimindo a tela inteira.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('printing-score');
    return () => document.body.classList.remove('printing-score');
  }, [open]);

  const update = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  if (!open) {
    return (
      <div className="print">
        <p className="print__intro">
          Organiza a partitura em folhas para imprimir ou salvar em PDF, no tom que está na tela.
        </p>
        <button
          type="button"
          className="print__action"
          disabled={musicXml === null}
          onClick={() => setOpen(true)}
        >
          Preparar impressão
        </button>
      </div>
    );
  }

  return (
    <div className="print">
      <form className="print__settings print-hide" onSubmit={(event) => event.preventDefault()}>
        <label className="print__field" htmlFor={`${id}-paper`}>
          Papel
          <select
            id={`${id}-paper`}
            value={settings.paper}
            onChange={(event) => update('paper', event.target.value as Paper)}
          >
            {(Object.keys(PAPER_LABEL) as Paper[]).map((paper) => (
              <option key={paper} value={paper}>
                {PAPER_LABEL[paper]}
              </option>
            ))}
          </select>
        </label>

        <label className="print__field" htmlFor={`${id}-orientation`}>
          Orientação
          <select
            id={`${id}-orientation`}
            value={settings.orientation}
            onChange={(event) => update('orientation', event.target.value as Orientation)}
          >
            <option value="portrait">Retrato</option>
            <option value="landscape">Paisagem</option>
          </select>
        </label>

        <label className="print__field" htmlFor={`${id}-scale`}>
          Tamanho da notação
          <select
            id={`${id}-scale`}
            value={settings.scale}
            onChange={(event) => update('scale', Number(event.target.value))}
          >
            {PRINT_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {Math.round(scale * 100)}%
              </option>
            ))}
          </select>
        </label>

        <label className="print__field" htmlFor={`${id}-margins`}>
          Margens
          <select
            id={`${id}-margins`}
            value={settings.margins}
            onChange={(event) => update('margins', event.target.value as MarginSize)}
          >
            {(Object.keys(MARGIN_LABEL) as MarginSize[]).map((margins) => (
              <option key={margins} value={margins}>
                {MARGIN_LABEL[margins]}
              </option>
            ))}
          </select>
        </label>

        <label className="print__check">
          <input
            type="checkbox"
            checked={settings.showTitle}
            onChange={(event) => update('showTitle', event.target.checked)}
          />
          Título e autor na primeira folha
        </label>
      </form>

      {musicXml === null ? (
        <p className="print__intro print-hide">Nenhuma partitura aberta.</p>
      ) : (
        <PrintPreview musicXml={musicXml} label={label} settings={settings} />
      )}

      <div className="print__buttons print-hide">
        <button
          type="button"
          className="print__action"
          disabled={musicXml === null}
          onClick={() => window.print()}
        >
          Imprimir ou salvar PDF
        </button>
        <button type="button" className="print__secondary" onClick={() => setOpen(false)}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function PrintPreview({
  musicXml,
  label,
  settings,
}: {
  readonly musicXml: string;
  readonly label: string;
  readonly settings: PrintSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [state, setState] = useState<{ pages: number } | { error: string } | null>(null);
  const layout = printLayout(settings);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    osmdRef.current = new OpenSheetMusicDisplay(container, {
      autoResize: false,
      backend: 'svg',
      drawMeasureNumbersOnlyAtSystemStart: true,
      pageBackgroundColor: '#FFFFFF',
    });

    return () => {
      osmdRef.current = null;
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd) return;

    let cancelled = false;
    const { pageFormat, marginUnits } = printLayout(settings);

    osmd.setOptions({
      pageFormat,
      drawTitle: settings.showTitle,
      drawSubtitle: settings.showTitle,
      drawComposer: settings.showTitle,
      drawLyricist: settings.showTitle,
    });

    void osmd
      .load(musicXml, '')
      .then(() => {
        if (cancelled) return;
        osmd.setOptions({ drawPartNames: osmd.Sheet.Instruments.length > 1 });
        osmd.zoom = settings.scale;
        const rules = osmd.EngravingRules;
        rules.PageTopMargin = marginUnits;
        rules.PageBottomMargin = marginUnits;
        rules.PageLeftMargin = marginUnits;
        rules.PageRightMargin = marginUnits;
        rules.SheetTitleHeight = titleHeight(osmd.Sheet.TitleString, settings);
        osmd.render();
        setState({ pages: osmd.GraphicSheet.MusicPages.length });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ error: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [musicXml, settings]);

  return (
    <>
      {/* O `@page` acompanha a escolha: o navegador já abre a impressão no papel certo. */}
      <style>{`@media print { @page { size: ${layout.cssPageSize}; margin: 0; } }`}</style>
      <p className="print__summary print-hide" role="status" aria-live="polite">
        {state === null
          ? 'Organizando as folhas…'
          : 'error' in state
            ? `Não foi possível organizar as folhas: ${state.error}`
            : `${state.pages} ${state.pages === 1 ? 'folha' : 'folhas'}. Na janela de impressão, escolha a impressora ou "Salvar como PDF".`}
      </p>
      <div className="print-pages">
        <div
          className="print-pages__sheet"
          ref={containerRef}
          role="img"
          aria-label={`Pré-visualização da impressão. ${label}`}
          style={{ width: `${layout.widthPx}px` }}
        />
      </div>
    </>
  );
}
