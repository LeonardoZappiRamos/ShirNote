import { randomUUID } from 'expo-crypto';
import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';

import {
  classifyImport,
  convertEncore,
  convertMusicXml,
  ImportError,
  type ImportedScoreData,
} from './importFile';
import { canAddScore, freeLimitMessage } from './plan';
import type { ScoreRepository } from './repository';
import type { Plan, ScoreSummary } from './types';

export interface ImportResult {
  readonly score: ScoreSummary;
  readonly warningCount: number;
}

/**
 * RFM-01/RFM-02: escolhe o arquivo, converte localmente e grava na biblioteca.
 * Devolve `null` quando o usuário cancela o seletor.
 */
export async function pickAndImportScore(
  repository: ScoreRepository,
  plan: Plan,
): Promise<ImportResult | null> {
  const count = await repository.count();
  if (!canAddScore(plan, count)) {
    throw new ImportError(freeLimitMessage());
  }

  const picked = await getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (picked.canceled) return null;

  const asset = picked.assets[0];
  if (!asset) {
    throw new ImportError('Nenhum arquivo foi selecionado.');
  }

  const kind = classifyImport(asset.name);
  if (!kind) {
    throw new ImportError('Formato não suportado. Escolha um arquivo .enc, .musicxml ou .xml.');
  }

  const imported = await readFile(asset.uri, asset.name, kind);
  const id = randomUUID();

  await repository.insert({
    id,
    title: imported.title,
    composer: imported.composer,
    kind: imported.kind,
    musicXml: imported.musicXml,
    scoreJson: imported.scoreJson,
    fileUri: null,
    pageCount: null,
    transposition: 0,
  });

  const score = await repository.get(id);
  if (!score) {
    throw new ImportError('A partitura foi importada, mas não pôde ser relida da biblioteca.');
  }

  return { score, warningCount: imported.warnings.length };
}

async function readFile(
  uri: string,
  fileName: string,
  kind: 'enc' | 'musicxml',
): Promise<ImportedScoreData> {
  const file = new File(uri);

  try {
    if (kind === 'enc') {
      return convertEncore(await file.arrayBuffer(), fileName);
    }
    return convertMusicXml(await file.text(), fileName);
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError('Não foi possível ler o arquivo selecionado.');
  }
}
