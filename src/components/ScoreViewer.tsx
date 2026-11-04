import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useEffect, useRef } from 'react';

export interface ShownScore {
  /** `null` limpa a área: depois de um erro, a partitura anterior não fica na tela. */
  readonly musicXml: string | null;
  /** Nome acessível da partitura desenhada (RNF-07); o SVG do OSMD não tem texto útil. */
  readonly label: string;
}

interface ScoreViewerProps {
  /** Cada objeto novo redesenha, mesmo com o MusicXML igual (o mesmo arquivo aberto de novo). */
  readonly score: ShownScore;
  readonly zoom: number;
  readonly onError: (error: unknown) => void;
  readonly onRendered: () => void;
}

/**
 * RF-09/RF-10: renderiza o MusicXML com OSMD.
 *
 * O OSMD diagrama na largura do contêiner (`autoResize`); o zoom é aplicado como
 * `transform: scale()` no contêiner, para ampliar de verdade e deixar o `.score`
 * rolar em vez de reengravitar a partitura em outra largura.
 */
export function ScoreViewer({ score, zoom, onError, onRendered }: ScoreViewerProps) {
  const { musicXml, label } = score;
  const containerRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef(onError);
  const renderedRef = useRef(onRendered);

  errorRef.current = onError;
  renderedRef.current = onRendered;

  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  // Uma instância por montagem: o OSMD não remove o listener de `resize`, e uma instância antiga
  // redesenharia a partitura anterior por cima da nova ao redimensionar a janela.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      backend: 'svg',
      drawMeasureNumbersOnlyAtSystemStart: true,
    });
    osmdRef.current = osmd;

    return () => {
      osmd.AutoResizeEnabled = false;
      osmdRef.current = null;
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd) return;

    const { musicXml } = score;
    if (musicXml === null) {
      // Sem isto, o próximo resize redesenharia a partitura que continua carregada no OSMD.
      osmd.AutoResizeEnabled = false;
      containerRef.current?.replaceChildren();
      return;
    }

    let cancelled = false;

    // RF-04: sem título no arquivo, nada no lugar (o padrão do OSMD é "Untitled Score").
    void osmd
      .load(musicXml, '')
      .then(() => {
        if (cancelled) return;
        // RF-07: o nome da parte só distingue partes; o Encore não dá um nome comprovado.
        osmd.setOptions({ drawPartNames: osmd.Sheet.Instruments.length > 1 });
        osmd.AutoResizeEnabled = true;
        osmd.render();
        renderedRef.current();
      })
      .catch((error: unknown) => {
        if (!cancelled) errorRef.current(error);
      });

    return () => {
      cancelled = true;
    };
  }, [score]);

  // RNF-07: a área rola com as setas quando o zoom passa da largura, por isso entra no Tab.
  return (
    <div className="score" tabIndex={0} role="region" aria-label="Área da partitura">
      {musicXml === null ? <p className="score__empty">Nenhuma partitura aberta.</p> : null}
      <div
        className="score__canvas"
        ref={containerRef}
        role="img"
        aria-label={label}
        hidden={musicXml === null}
        style={{ transform: `scale(${zoom})` }}
      />
    </div>
  );
}
