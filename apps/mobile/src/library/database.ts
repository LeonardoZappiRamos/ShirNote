import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'shirnote.db';

/**
 * Migrações versionadas. Cada item roda uma vez e é registrado em `PRAGMA user_version`.
 * Nunca edite uma migração publicada: acrescente outra no fim.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    composer TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('enc', 'musicxml', 'pdf')),
    musicxml TEXT,
    score_json TEXT,
    file_uri TEXT,
    page_count INTEGER,
    transposition INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS scores_updated_at_idx ON scores (updated_at DESC);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Abre (uma vez) o banco da biblioteca e aplica as migrações pendentes. */
export function openLibraryDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openAndMigrate().catch((error: unknown) => {
    // Uma falha de abertura não pode deixar a tela presa num promise rejeitado para sempre.
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // WAL melhora leitura e escrita simultâneas; foreign_keys fica ligado para as próximas tabelas.
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(database);

  return database;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  for (let index = currentVersion; index < MIGRATIONS.length; index += 1) {
    const migration = MIGRATIONS[index];
    if (!migration) continue;

    await database.withTransactionAsync(async () => {
      await database.execAsync(migration);
      // O índice vem do array, nunca de entrada do usuário; não há bind para PRAGMA.
      await database.execAsync(`PRAGMA user_version = ${index + 1}`);
    });
  }
}
