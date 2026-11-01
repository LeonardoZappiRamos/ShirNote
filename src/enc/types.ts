import type { Score } from '../music';

export type EncoreErrorCode = 'not-encore' | 'unsupported-version' | 'truncated' | 'corrupt';

/** Erro esperado ao ler um `.enc` incompatível — a UI mostra a mensagem ao usuário. */
export class EncoreFormatError extends Error {
  readonly code: EncoreErrorCode;

  constructor(code: EncoreErrorCode, message: string) {
    super(message);
    this.name = 'EncoreFormatError';
    this.code = code;
  }
}

/** Recurso encontrado no arquivo que o parser reconheceu mas não converteu (modo tolerante, RF-11). */
export interface ParseWarning {
  readonly code: string;
  readonly message: string;
}

export interface EncoreParseResult {
  readonly score: Score;
  readonly warnings: readonly ParseWarning[];
}

/**
 * Contrato do parser `.enc`. A implementação entra na Fase 2, depois de
 * `docs/enc-format.md` provar o layout do arquivo (portão G1).
 */
export interface EncoreParser {
  parse(data: ArrayBuffer): EncoreParseResult;
}
