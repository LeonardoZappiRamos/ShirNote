/** Tipos da biblioteca local do app (RFM-04, ADR 0006). */

export type ScoreKind = 'enc' | 'musicxml' | 'pdf';

export type Plan = 'free' | 'pro';

/** Metadados suficientes para desenhar a galeria, sem carregar o MusicXML. */
export interface ScoreSummary {
  readonly id: string;
  readonly title: string;
  readonly composer: string | null;
  readonly kind: ScoreKind;
  readonly pageCount: number | null;
  /** Semitons aplicados sobre o tom original; 0 é o tom do arquivo. */
  readonly transposition: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Item completo, usado pelo visualizador e pela edição. */
export interface ScoreRecord extends ScoreSummary {
  readonly musicXml: string | null;
  readonly scoreJson: string | null;
  readonly fileUri: string | null;
}

export interface NewScore {
  readonly id: string;
  readonly title: string;
  readonly composer: string | null;
  readonly kind: ScoreKind;
  readonly musicXml: string | null;
  readonly scoreJson: string | null;
  readonly fileUri: string | null;
  readonly pageCount: number | null;
  readonly transposition: number;
}
