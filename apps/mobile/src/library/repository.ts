import type * as SQLite from 'expo-sqlite';

import {
  parseReadingPosition,
  readingPositionKey,
  serializeReadingPosition,
  type ReadingPosition,
} from './reading';
import type { NewScore, ScoreKind, ScoreRecord, ScoreSummary } from './types';

interface ScoreRow {
  readonly id: string;
  readonly title: string;
  readonly composer: string | null;
  readonly kind: string;
  readonly musicxml: string | null;
  readonly score_json: string | null;
  readonly file_uri: string | null;
  readonly page_count: number | null;
  readonly transposition: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ScoreRepository {
  list(): Promise<ScoreSummary[]>;
  count(): Promise<number>;
  get(id: string): Promise<ScoreRecord | null>;
  insert(score: NewScore): Promise<void>;
  updateTransposition(
    id: string,
    semitones: number,
    musicXml: string,
    scoreJson: string | null,
  ): Promise<void>;
  updateMetadata(id: string, title: string, composer: string | null): Promise<void>;
  getReadingPosition(id: string): Promise<ReadingPosition>;
  saveReadingPosition(id: string, position: ReadingPosition): Promise<void>;
  remove(id: string): Promise<void>;
}

const SUMMARY_COLUMNS =
  'id, title, composer, kind, page_count, transposition, created_at, updated_at';

export function createScoreRepository(database: SQLite.SQLiteDatabase): ScoreRepository {
  return {
    async list() {
      const rows = await database.getAllAsync<ScoreRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM scores ORDER BY updated_at DESC`,
      );
      return rows.map(toSummary);
    },

    async count() {
      const row = await database.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM scores',
      );
      return row?.total ?? 0;
    },

    async get(id) {
      const row = await database.getFirstAsync<ScoreRow>('SELECT * FROM scores WHERE id = ?', id);
      return row ? toRecord(row) : null;
    },

    async insert(score) {
      const now = new Date().toISOString();
      await database.runAsync(
        `INSERT INTO scores
          (id, title, composer, kind, musicxml, score_json, file_uri, page_count, transposition, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        score.id,
        score.title,
        score.composer,
        score.kind,
        score.musicXml,
        score.scoreJson,
        score.fileUri,
        score.pageCount,
        score.transposition,
        now,
        now,
      );
    },

    async updateTransposition(id, semitones, musicXml, scoreJson) {
      await database.runAsync(
        `UPDATE scores
         SET transposition = ?, musicxml = ?, score_json = ?, updated_at = ?
         WHERE id = ?`,
        semitones,
        musicXml,
        scoreJson,
        new Date().toISOString(),
        id,
      );
    },

    async updateMetadata(id, title, composer) {
      await database.runAsync(
        'UPDATE scores SET title = ?, composer = ?, updated_at = ? WHERE id = ?',
        title,
        composer,
        new Date().toISOString(),
        id,
      );
    },

    async getReadingPosition(id) {
      const row = await database.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        readingPositionKey(id),
      );
      return parseReadingPosition(row?.value);
    },

    async saveReadingPosition(id, position) {
      await database.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        readingPositionKey(id),
        serializeReadingPosition(position),
      );
    },

    async remove(id) {
      await database.withTransactionAsync(async () => {
        await database.runAsync('DELETE FROM scores WHERE id = ?', id);
        await database.runAsync('DELETE FROM settings WHERE key = ?', readingPositionKey(id));
      });
    },
  };
}

function toSummary(row: ScoreRow): ScoreSummary {
  return {
    id: row.id,
    title: row.title,
    composer: row.composer,
    kind: row.kind as ScoreKind,
    pageCount: row.page_count,
    transposition: row.transposition,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRecord(row: ScoreRow): ScoreRecord {
  return {
    ...toSummary(row),
    musicXml: row.musicxml,
    scoreJson: row.score_json,
    fileUri: row.file_uri,
  };
}
