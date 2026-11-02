/** Tipos do que os testes usam do spike descartável. */
export interface ReferenceMeasure {
  readonly events: readonly Record<string, unknown>[];
  readonly [field: string]: unknown;
}

export interface ReferenceScore {
  readonly measures: readonly ReferenceMeasure[];
  readonly title: string;
  readonly author: string;
}

export function readReferenceXml(xml: string): ReferenceScore;
