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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      backend: 'svg',
      drawMeasureNumbersOnlyAtSystemStart: true,
    });

    let cancelled = false;

    void osmd
      .load(musicXml)
      .then(() => {
        if (cancelled) return;
        osmd.render();
        renderedRef.current();
      })
      .catch((error: unknown) => {
        if (!cancelled) errorRef.current(error);
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [musicXml]);

  return (
    <div className="score">
      <div className="score__canvas" ref={containerRef} style={{ transform: `scale(${zoom})` }} />
    </div>
  );
}
