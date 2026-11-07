import { useCallback, useMemo, useRef, useState } from 'react';
import {
  EncoreFormatError,
  inspectBinary,
  parseEncore,
  type BinarySnapshot,
  type EncoreErrorCode,
} from '../enc';
import {
  UNISON,
  intervalName,
  simpleMelody,
  transposeScoreByInterval,
  validateScore,
  type Interval,
  type KeySignature,
  type Score,
} from '../music';
import { generateMusicXml } from '../musicxml';
import logoUrl from '../assets/shirnote-icon.svg';
import duasPautasUrl from '../../tests/fixtures/controlled/controle-16-duas-pautas.enc?url';
import duasVozesUrl from '../../tests/fixtures/controlled/controle-18-duas-vozes.enc?url';
import seuTempoUrl from '../../tests/fixtures/samples/seu-tempo-melodia.enc?url';
import { FileUploader } from './FileUploader';
import { PrintPanel } from './PrintPanel';
import { ScoreViewer, type ShownScore } from './ScoreViewer';
import { StatusBar, type ViewerStatus } from './StatusBar';
import { TransposeControls } from './TransposeControls';

/** Partitura aberta, no tom do arquivo; a transposição é aplicada só na hora de desenhar. */
interface OpenedScore {
  readonly score: Score;
  readonly label: string;
}

const DEMO: OpenedScore = {
  score: simpleMelody,
  label: scoreLabel(simpleMelody.title, 'partitura de exemplo'),
};
const demoWarnings = validateScore(simpleMelody).map((issue) => issue.message);

const INITIAL_STATUS: ViewerStatus = {
  stage: 'ready',
  message: 'Partitura de exemplo carregada. Abra um arquivo .enc para ver a sua partitura.',
  warnings: demoWarnings,
};

/**
 * RF-12: exemplos para demonstração. A melodia real é do acervo com uso liberado para o projeto
 * (docs/enc-format.md, seção 11); as outras são amostras controladas. Vêm do próprio site, como o
 * resto do app; nada sai do navegador.
 */
const EXAMPLES = [
  { label: 'Melodia com título e autor', fileName: 'seu-tempo-melodia.enc', url: seuTempoUrl },
  { label: 'Piano (duas pautas)', fileName: 'controle-16-duas-pautas.enc', url: duasPautasUrl },
  { label: 'Duas vozes', fileName: 'controle-18-duas-vozes.enc', url: duasVozesUrl },
] as const;

/** PRD, seção 9: a mensagem de arquivo inválido diz o motivo e o que fazer. */
const ERROR_HINT: Readonly<Record<EncoreErrorCode, string>> = {
  'not-encore': 'Confira se o arquivo foi salvo pelo Encore.',
  'unsupported-version':
    'Por enquanto o ShirNote abre só a versão do formato das partituras de teste; o arquivo não foi alterado.',
  truncated: 'Salve o arquivo de novo no Encore ou obtenha outra cópia e tente outra vez.',
  corrupt: 'Salve o arquivo de novo no Encore ou obtenha outra cópia e tente outra vez.',
};

const NO_SCORE: ShownScore = { musicXml: null, label: 'Nenhuma partitura aberta' };

interface LoadedFile {
  readonly fileName: string;
  readonly snapshot: BinarySnapshot;
}

export function App() {
  const [status, setStatus] = useState<ViewerStatus>(INITIAL_STATUS);
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [opened, setOpened] = useState<OpenedScore | null>(DEMO);
  const [transposition, setTransposition] = useState<Interval>(UNISON);
  const [simplifyDoubles, setSimplifyDoubles] = useState(false);
  const [zoom, setZoom] = useState(1);
  /** Resultado do parse que só vira "pronto" quando o OSMD termina de desenhar (tarefa 3.2). */
  const pendingRef = useRef<{ message: string; warnings: readonly string[] } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    pendingRef.current = null;

    if (!file.name.toLowerCase().endsWith('.enc')) {
      setOpened(null);
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
      setOpened({ score, label: scoreLabel(score.title, file.name) });
      setTransposition(UNISON);

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
      setOpened(null);
      setStatus({
        stage: 'error',
        message:
          error instanceof EncoreFormatError
            ? `Não foi possível abrir "${file.name}": ${error.message} ${ERROR_HINT[error.code]}`
            : `Falha ao ler "${file.name}": ${describeError(error)}`,
        warnings: [],
      });
    }
  }, []);

  const openExample = useCallback(
    async ({ fileName, url }: (typeof EXAMPLES)[number]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await handleFile(new File([await response.blob()], fileName));
      } catch (error) {
        setOpened(null);
        setStatus({
          stage: 'error',
          message: `Não foi possível carregar o exemplo "${fileName}": ${describeError(error)}`,
          warnings: [],
        });
      }
    },
    [handleFile],
  );

  const busy = status.stage === 'reading' || status.stage === 'rendering';

  // Um objeto novo por arquivo aberto ou por intervalo escolhido: o ScoreViewer redesenha.
  const shown = useMemo<ShownScore>(() => {
    if (!opened) return NO_SCORE;
    const transposed = transposeScoreByInterval(opened.score, transposition, { simplifyDoubles });
    const suffix =
      transposed === opened.score ? '' : ` (transposta: ${intervalName(transposition)})`;
    return { musicXml: generateMusicXml(transposed), label: `${opened.label}${suffix}` };
  }, [opened, transposition, simplifyDoubles]);

  const handleRendered = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setStatus({ stage: 'ready', ...pending });
  }, []);

  const handleRenderError = useCallback((error: unknown) => {
    pendingRef.current = null;
    setOpened(null);
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
      <header className="app__header print-hide">
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
        <section className="panel print-hide" aria-labelledby="upload-title">
          <h2 id="upload-title">1. Abrir arquivo</h2>
          <FileUploader onFile={handleFile} disabled={busy} />
          <div className="examples" role="group" aria-labelledby="examples-title">
            <p id="examples-title" className="examples__title">
              Ou abra um exemplo:
            </p>
            <ul className="examples__list">
              {EXAMPLES.map((example) => (
                <li key={example.fileName}>
                  <button
                    type="button"
                    className="examples__button"
                    disabled={busy}
                    onClick={() => void openExample(example)}
                  >
                    {example.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {loadedFile ? (
            <BinaryPreview fileName={loadedFile.fileName} snapshot={loadedFile.snapshot} />
          ) : null}
        </section>

        <section className="panel print-hide" aria-labelledby="status-title">
          <h2 id="status-title">2. Status</h2>
          <StatusBar status={status} />
        </section>

        <section className="panel panel--score print-hide" aria-labelledby="score-title">
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
          {opened ? (
            <TransposeControls
              sourceKey={sourceKeyOf(opened.score)}
              interval={transposition}
              onChange={setTransposition}
              simplifyDoubles={simplifyDoubles}
              onSimplifyDoublesChange={setSimplifyDoubles}
              disabled={busy}
            />
          ) : null}
          <ScoreViewer
            score={shown}
            zoom={zoom}
            onError={handleRenderError}
            onRendered={handleRendered}
          />
        </section>

        <section className="panel panel--print" aria-labelledby="print-title">
          <h2 id="print-title" className="print-hide">
            4. Imprimir
          </h2>
          <PrintPanel musicXml={shown.musicXml} label={shown.label} />
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

/** Armação e modo da primeira parte; sem armação no arquivo, dó maior. */
function sourceKeyOf(score: Score): KeySignature {
  for (const measure of score.parts[0]?.measures ?? []) {
    if (measure.attributes?.key) return measure.attributes.key;
  }
  return { fifths: 0 };
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
