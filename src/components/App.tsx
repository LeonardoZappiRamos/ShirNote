import { useCallback, useRef, useState } from 'react';
import { EncoreFormatError, inspectBinary, parseEncore, type BinarySnapshot } from '../enc';
import { simpleMelody, validateScore } from '../music';
import { generateMusicXml } from '../musicxml';
import logoUrl from '../assets/shirnote-icon.svg';
import { FileUploader } from './FileUploader';
import { ScoreViewer, type ShownScore } from './ScoreViewer';
import { StatusBar, type ViewerStatus } from './StatusBar';

const DEMO: ShownScore = {
  musicXml: generateMusicXml(simpleMelody),
  label: scoreLabel(simpleMelody.title, 'partitura de exemplo'),
};
const demoWarnings = validateScore(simpleMelody).map((issue) => issue.message);

const INITIAL_STATUS: ViewerStatus = {
  stage: 'ready',
  message: 'Partitura de exemplo carregada. Abra um arquivo .enc para ver a sua partitura.',
  warnings: demoWarnings,
};

const NO_SCORE: ShownScore = { musicXml: null, label: 'Nenhuma partitura aberta' };

interface LoadedFile {
  readonly fileName: string;
  readonly snapshot: BinarySnapshot;
}

export function App() {
  const [status, setStatus] = useState<ViewerStatus>(INITIAL_STATUS);
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [shown, setShown] = useState<ShownScore>(DEMO);
  const [zoom, setZoom] = useState(1);
  /** Resultado do parse que só vira "pronto" quando o OSMD termina de desenhar (tarefa 3.2). */
  const pendingRef = useRef<{ message: string; warnings: readonly string[] } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    pendingRef.current = null;

    if (!file.name.toLowerCase().endsWith('.enc')) {
      setShown(NO_SCORE);
      setStatus({
        stage: 'error',
        message: `"${file.name}" não tem extensão .enc. Selecione um arquivo criado no Encore.`,
        warnings: [],
      });
      return;
    }

    setStatus({ stage: 'reading', message: `Lendo "${file.name}"…`, warnings: [] });

    try {
      const buffer = await file.arrayBuffer();
      setLoadedFile({ fileName: file.name, snapshot: inspectBinary(buffer) });
      // ADR 0003: parse na thread principal. A maior amostra (63 KB, 417 notas) leva 2,3 ms de mediana
      // com a geração do MusicXML; se passar de 100 ms, o worker entra.
      const { score, warnings } = parseEncore(new Uint8Array(buffer));
      setShown({ musicXml: generateMusicXml(score), label: scoreLabel(score.title, file.name) });

      const warningMessages = warnings.map((warning) => warning.message);
      pendingRef.current = {
        message: `"${file.name}" (${formatBytes(buffer.byteLength)}) foi lido no navegador.`,
        warnings: warningMessages,
      };
      setStatus({
        stage: 'rendering',
        message: `Desenhando "${file.name}"…`,
        warnings: warningMessages,
      });
    } catch (error) {
      setShown(NO_SCORE);
      setStatus({
        stage: 'error',
        message:
          error instanceof EncoreFormatError
            ? `Não foi possível abrir "${file.name}": ${error.message}`
            : `Falha ao ler "${file.name}": ${describeError(error)}`,
        warnings: [],
      });
    }
  }, []);

  const handleRendered = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setStatus({ stage: 'ready', ...pending });
  }, []);

  const handleRenderError = useCallback((error: unknown) => {
    pendingRef.current = null;
    setShown(NO_SCORE);
    setStatus({
      stage: 'error',
      message: `Falha ao renderizar a partitura: ${describeError(error)}`,
      warnings: [],
    });
  }, []);

  const changeZoom = (delta: number) => {
    setZoom((current) => Math.min(2, Math.max(0.5, Math.round((current + delta) * 10) / 10)));
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <img className="app__logo" src={logoUrl} alt="" width="40" height="58" />
          <div>
            <h1 className="app__title">
              Shir<span className="app__title-accent">Note</span>
            </h1>
            <p className="app__tagline">Visualizador web de partituras Encore (.enc)</p>
          </div>
        </div>
        <p className="app__privacy">Processamento local: nenhum arquivo sai do navegador.</p>
      </header>

      <main className="app__main">
        <section className="panel" aria-labelledby="upload-title">
          <h2 id="upload-title">1. Abrir arquivo</h2>
          <FileUploader
            onFile={handleFile}
            disabled={status.stage === 'reading' || status.stage === 'rendering'}
          />
          {loadedFile ? (
            <BinaryPreview fileName={loadedFile.fileName} snapshot={loadedFile.snapshot} />
          ) : null}
        </section>

        <section className="panel" aria-labelledby="status-title">
          <h2 id="status-title">2. Status</h2>
          <StatusBar status={status} />
        </section>

        <section className="panel panel--score" aria-labelledby="score-title">
          <div className="panel__heading">
            <h2 id="score-title">3. Partitura</h2>
            <div className="zoom" role="group" aria-label="Zoom da partitura">
              <button
                type="button"
                className="zoom__button"
                onClick={() => changeZoom(-0.1)}
                aria-label="Diminuir zoom"
              >
                −
              </button>
              <output className="zoom__value" aria-live="polite">
                {Math.round(zoom * 100)}%
              </output>
              <button
                type="button"
                className="zoom__button"
                onClick={() => changeZoom(0.1)}
                aria-label="Aumentar zoom"
              >
                +
              </button>
              <button type="button" className="zoom__reset" onClick={() => setZoom(1)}>
                Tamanho original
              </button>
            </div>
          </div>
          <ScoreViewer
            score={shown}
            zoom={zoom}
            onError={handleRenderError}
            onRendered={handleRendered}
          />
        </section>
      </main>
    </div>
  );
}

function BinaryPreview({
  fileName,
  snapshot,
}: {
  readonly fileName: string;
  readonly snapshot: BinarySnapshot;
}) {
  return (
    <details className="binary">
      <summary className="binary__summary">Diagnóstico do cabeçalho — {fileName}</summary>
      <dl className="binary__list">
        <dt>Tamanho</dt>
        <dd>
          {snapshot.byteLength} bytes ({snapshot.previewByteLength} na prévia)
        </dd>
        <dt>Hexadecimal</dt>
        <dd>
          <code>{snapshot.hex}</code>
        </dd>
        <dt>ASCII</dt>
        <dd>
          <code>{snapshot.ascii}</code>
        </dd>
      </dl>
      <p className="binary__note">
        Ferramenta de diagnóstico: os primeiros bytes do arquivo, como estão no disco.
      </p>
    </details>
  );
}

function scoreLabel(title: string | undefined, fallback: string): string {
  return `Partitura: ${title ?? fallback}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
