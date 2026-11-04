import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useEffect, useRef } from 'react';

interface ScoreViewerProps {
  readonly musicXml: string;
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
export function ScoreViewer({ musicXml, zoom, onError, onRendered }: ScoreViewerProps) {
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

    let cancelled = false;

    // RF-04: sem título no arquivo, nada no lugar (o padrão do OSMD é "Untitled Score").
    void osmd
      .load(musicXml, '')
      .then(() => {
        if (cancelled) return;
        // RF-07: o nome da parte só distingue partes; o Encore não dá um nome comprovado.
        osmd.setOptions({ drawPartNames: osmd.Sheet.Instruments.length > 1 });
        osmd.render();
        renderedRef.current();
      })
      .catch((error: unknown) => {
        if (!cancelled) errorRef.current(error);
      });

    return () => {
      cancelled = true;
    };
  }, [musicXml]);

  return (
    <div className="score">
      <div className="score__canvas" ref={containerRef} style={{ transform: `scale(${zoom})` }} />
    </div>
  );
}
