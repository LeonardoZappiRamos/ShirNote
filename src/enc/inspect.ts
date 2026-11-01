export interface BinarySnapshot {
  readonly byteLength: number;
  readonly previewByteLength: number;
  /** Bytes iniciais em hexadecimal, separados por espaço. */
  readonly hex: string;
  /** Mesmos bytes como ASCII imprimível; o resto vira ".". */
  readonly ascii: string;
}

/**
 * Prévia dos primeiros bytes de um arquivo. Serve à Fase 1 (comparação hexadecimal
 * das amostras) e ao diagnóstico da UI, sem depender do parser.
 */
export function inspectBinary(data: ArrayBuffer | Uint8Array, maxBytes = 64): BinarySnapshot {
  if (!Number.isInteger(maxBytes) || maxBytes < 0) {
    throw new Error(`maxBytes deve ser um inteiro ≥ 0 (recebido: ${maxBytes}).`);
  }

  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const preview = bytes.subarray(0, Math.min(maxBytes, bytes.length));

  const hex = Array.from(preview, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(
    ' ',
  );
  const ascii = Array.from(preview, (byte) =>
    byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.',
  ).join('');

  return { byteLength: bytes.length, previewByteLength: preview.length, hex, ascii };
}
