import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * Visualizador offline que roda dentro da WebView (ADR 0005).
 * A ponte só transporta MusicXML, zoom, posição de leitura e eventos tipados — nunca HTML
 * vindo do app.
 */

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
    ShirNoteViewer?: { handle(message: unknown): void };
  }
}

// Mantenha em sincronia com MIN_READING_ZOOM/MAX_READING_ZOOM em src/library/reading.ts.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const SCROLL_REPORT_INTERVAL_MS = 400;

const scoreRoot = document.getElementById('score');
const scrollRoot = document.getElementById('scroll');
const stageElement = document.getElementById('stage') ?? document.body;

if (!scoreRoot || !scrollRoot) {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: 'error', message: 'Elemento da partitura não encontrado.' }),
  );
  throw new Error('Elemento da partitura não encontrado.');
}

const scoreElement: HTMLElement = scoreRoot;
const scrollElement: HTMLElement = scrollRoot;

let osmd: OpenSheetMusicDisplay | null = null;
let renderToken = 0;
let renderedWidth = 0;
// Última posição de leitura estável. No evento `resize` a altura visível já mudou, então a
// fração calculada ali seria outra.
let lastScrollRatio = 0;

function post(message: unknown): void {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

function getOsmd(): OpenSheetMusicDisplay {
  osmd ??= new OpenSheetMusicDisplay(scoreElement, {
    // O redimensionamento é tratado em `handleResize`: o do OSMD redesenha e zera a rolagem.
    autoResize: false,
    backend: 'svg',
    drawMeasureNumbersOnlyAtSystemStart: true,
    drawTitle: false,
    drawComposer: false,
    drawCredits: false,
  });

  return osmd;
}

/**
 * `zoom` de CSS redimensiona o layout, então a área rolável cresce junto. Um
 * `transform: scale()` ampliaria o desenho sem permitir rolar até o fim.
 * A fração de rolagem é preservada para o zoom não jogar o leitor para outro ponto.
 */
function applyZoom(value: number): void {
  const ratio = currentScrollRatio();
  const zoom = Number.isFinite(value) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)) : 1;

  stageElement.style.zoom = String(zoom);
  window.requestAnimationFrame(() => applyScrollRatio(ratio));
}

function applyScrollRatio(value: number): void {
  const ratio = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const maxScroll = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
  scrollElement.scrollTop = ratio * maxScroll;
}

function currentScrollRatio(): number {
  const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
  return maxScroll > 0 ? scrollElement.scrollTop / maxScroll : 0;
}

async function render(
  musicXml: string,
  label: string,
  zoom: number,
  scrollRatio: number,
): Promise<void> {
  const token = ++renderToken;

  try {
    const instance = getOsmd();

    await instance.load(musicXml, '');
    if (token !== renderToken) return;

    instance.setOptions({ drawPartNames: instance.Sheet.Instruments.length > 1 });
    instance.render();
    renderedWidth = window.innerWidth;

    applyZoom(zoom);
    scoreElement.setAttribute('aria-label', label);

    // Espera o layout do OSMD para medir a altura certa antes de restaurar a posição.
    lastScrollRatio = scrollRatio;
    window.requestAnimationFrame(() => applyScrollRatio(scrollRatio));

    post({
      type: 'rendered',
      pageCount: instance.GraphicSheet?.MusicPages.length ?? 1,
    });
  } catch (error) {
    if (token !== renderToken) return;
    post({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

let scrollTimer: number | null = null;
let resizeTimer: number | null = null;

/**
 * Tela cheia, barra do sistema e a WebView se acomodando depois do primeiro desenho mudam o
 * tamanho. Só a largura muda as quebras de sistema; nos dois casos a leitura volta ao mesmo ponto.
 */
function handleResize(): void {
  const ratio = lastScrollRatio;

  if (osmd?.IsReadyToRender() && window.innerWidth !== renderedWidth) {
    osmd.render();
    renderedWidth = window.innerWidth;
  }

  applyScrollRatio(ratio);
}

window.addEventListener('resize', () => {
  if (resizeTimer !== null) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    handleResize();
  }, 150);
});

scrollElement.addEventListener(
  'scroll',
  () => {
    if (resizeTimer === null) lastScrollRatio = currentScrollRatio();
    if (scrollTimer !== null) return;

    scrollTimer = window.setTimeout(() => {
      scrollTimer = null;
      post({ type: 'scroll', ratio: lastScrollRatio });
    }, SCROLL_REPORT_INTERVAL_MS);
  },
  { passive: true },
);

window.ShirNoteViewer = {
  handle(value: unknown): void {
    if (!isRecord(value)) return;

    if (value.type === 'render' && typeof value.musicXml === 'string') {
      const label = typeof value.label === 'string' ? value.label : 'Partitura';
      const zoom = typeof value.zoom === 'number' ? value.zoom : 1;
      const scrollRatio = typeof value.scrollRatio === 'number' ? value.scrollRatio : 0;
      void render(value.musicXml, label, zoom, scrollRatio);
      return;
    }

    if (value.type === 'zoom' && typeof value.zoom === 'number') {
      applyZoom(value.zoom);
    }
  },
};

post({ type: 'ready' });
