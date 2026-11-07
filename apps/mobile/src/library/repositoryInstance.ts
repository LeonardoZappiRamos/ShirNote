import { openLibraryDatabase } from './database';
import { createScoreRepository, type ScoreRepository } from './repository';

let repositoryPromise: Promise<ScoreRepository> | null = null;

/** Repositório único do app; a primeira chamada abre o SQLite e migra o banco. */
export function getScoreRepository(): Promise<ScoreRepository> {
  repositoryPromise ??= openLibraryDatabase()
    .then(createScoreRepository)
    .catch((error: unknown) => {
      repositoryPromise = null;
      throw error;
    });

  return repositoryPromise;
}
