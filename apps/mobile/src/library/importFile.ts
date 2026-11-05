import { EncoreFormatError, parseEncore, type ParseWarning } from '../../../../src/enc';
import { generateMusicXml } from '../../../../src/musicxml';
import { titleFromFileName } from './format';
import type { ScoreKind } from './types';

export type ImportedKind = Extract<ScoreKind, 'enc' | 'musicxml'>;

export interface ImportedScoreData {
  readonly title: string;
  readonly composer: string | null;
  readonly kind: ImportedKind;
  readonly musicXml: string;
  readonly scoreJson: string | null;
  readonly warnings: readonly ParseWarning[];
}

/** Erro esperado de importação; a tela mostra a mensagem diretamente (RFM-17). */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

/** Decide o leitor pela extensão. O seletor aceita qualquer MIME porque `.enc` não tem um próprio. */
export function classifyImport(fileName: string): ImportedKind | null {
  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase();

  if (extension === 'enc') return 'enc';
  if (extension === 'musicxml' || extension === 'xml') return 'musicxml';
  return null;
}

/** Converte o `.enc` em MusicXML + modelo neutro, sem tocar em APIs do aparelho. */
export function convertEncore(buffer: ArrayBuffer, fileName: string): ImportedScoreData {
  try {
    const { score, warnings } = parseEncore(new Uint8Array(buffer));
    const musicXml = generateMusicXml(score);

    return {
      title: cleanText(score.title) ?? titleFromFileName(fileName),
      composer: cleanText(score.composer),
      kind: 'enc',
      musicXml,
      scoreJson: JSON.stringify(score),
      warnings,
    };
  } catch (error) {
    if (error instanceof EncoreFormatError) {
      throw new ImportError(error.message);
    }
    throw new ImportError('O arquivo .enc não pôde ser convertido em partitura.');
  }
}

/** MusicXML entra como está: o leitor para o modelo neutro ainda não existe (v1). */
export function convertMusicXml(text: string, fileName: string): ImportedScoreData {
  const musicXml = text.replace(/^\uFEFF/, '').trim();

  if (!/<score-(?:partwise|timewise)\b/i.test(musicXml)) {
    throw new ImportError('O arquivo não parece ser um MusicXML válido.');
  }

  return {
    title: titleFromFileName(fileName),
    composer: null,
    kind: 'musicxml',
    musicXml,
    scoreJson: null,
    warnings: [],
  };
}

function cleanText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}
