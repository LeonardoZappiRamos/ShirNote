import { useCallback, useState } from 'react';
import { inspectBinary, type BinarySnapshot } from '../enc';
import { simpleMelody, validateScore } from '../music';
import { generateMusicXml } from '../musicxml';
import { FileUploader } from './FileUploader';
import { ScoreViewer } from './ScoreViewer';
import { StatusBar, type ViewerStatus } from './StatusBar';

const demoMusicXml = generateMusicXml(simpleMelody);
const demoWarnings = validateScore(simpleMelody).map((issue) => issue.message);

const INITIAL_STATUS: ViewerStatus = {
  stage: 'ready',
  message:
    'Partitura de exemplo carregada. Ela vem de dados sintéticos, não de um arquivo .enc — o pipeline modelo → MusicXML → OSMD é o mesmo que o parser vai usar.',
  warnings: demoWarnings,
};

interface LoadedFile {
  readonly fileName: string;
  readonly snapshot: BinarySnapshot;
}

export function App() {
  const [status, setStatus] = useState<ViewerStatus>(INITIAL_STATUS);
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.enc')) {
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
      setStatus({
        stage: 'ready',
        message: `"${file.name}" (${formatBytes(buffer.byteLength)}) foi lido no navegador. O parser do Encore ainda não existe, então a partitura exibida continua sendo o exemplo sintético.`,
        warnings: ['Nenhum byte saiu da página: o arquivo ficou apenas na memória do navegador.'],
      });
    } catch (error) {
      setStatus({
        stage: 'error',
        message: `Falha ao ler "${file.name}": ${describeError(error)}`,
        warnings: [],
      });
    }
  }, []);

  const handleRenderError = useCallback((error: unknown) => {
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
        <div>
          <h1 className="app__title">ShirNote</h1>
          <p className="app__tagline">Visualizador web de partituras Encore (.enc)</p>
        </div>
        <p className="app__privacy">Processamento local: nenhum arquivo sai do navegador.</p>
      </header>

      <main className="app__main">
        <section className="panel" aria-labelledby="upload-title">
          <h2 id="upload-title">1. Abrir arquivo</h2>
          <FileUploader onFile={handleFile} disabled={status.stage === 'reading'} />
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
          <ScoreViewer musicXml={demoMusicXml} zoom={zoom} onError={handleRenderError} />
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
        Ferramenta da Fase 1 (catálogo de amostras): sem o parser, estes bytes não confirmam que o
        arquivo é do Encore.
      </p>
    </details>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
