/**
 * Leitura do contêiner `.enc` (Fase 1).
 *
 * Comprovado nas três amostras de `tests/fixtures/samples/`: o arquivo é uma cadeia de
 * blocos `tag[4 ASCII] + uint32LE(tamanho) + payload`, e a cadeia fecha exatamente no fim
 * do arquivo. Ver `docs/enc-format.md` seção 3.
 */

const TAG_PATTERN = /^[A-Z][A-Z0-9]{3}$/;

/**
 * Bytes que pertencem ao bloco mas ficam fora do tamanho declarado.
 * Medido em 117 transições `MEAS` das três amostras (todas terminam em `FF FF`);
 * ainda não é compreendido, por isso o valor fica isolado aqui.
 */
export const DEFAULT_TRAILERS: Readonly<Record<string, number>> = { MEAS: 54 };

export interface EncoreChunk {
  readonly tag: string;
  readonly offset: number;
  /** Tamanho declarado no cabeçalho do bloco. */
  readonly payloadLength: number;
  /** Bytes do trailer, fora do tamanho declarado. */
  readonly trailerLength: number;
  /** Offset do primeiro byte depois do bloco. */
  readonly endOffset: number;
}

export class ChunkFormatError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(message);
    this.name = 'ChunkFormatError';
    this.offset = offset;
  }
}

export interface ReadChunksOptions {
  readonly trailers?: Readonly<Record<string, number>>;
}

/** Lê a cadeia de blocos a partir de `startOffset`, parando na primeira tag inválida. */
export function readChunkChain(
  data: Uint8Array,
  startOffset: number,
  options: ReadChunksOptions = {},
): EncoreChunk[] {
  const trailers = options.trailers ?? DEFAULT_TRAILERS;
  const chunks: EncoreChunk[] = [];
  let position = startOffset;

  while (position + 8 <= data.length) {
    const tag = readTag(data, position);
    if (!tag) break;

    const payloadLength = readUint32(data, position + 4);
    const trailerLength = trailers[tag] ?? 0;
    const endOffset = position + 8 + payloadLength + trailerLength;

    if (endOffset > data.length) {
      throw new ChunkFormatError(
        `Bloco "${tag}" em 0x${position.toString(16)} termina em 0x${endOffset.toString(16)}, além do arquivo (0x${data.length.toString(16)}).`,
        position,
      );
    }

    chunks.push({ tag, offset: position, payloadLength, trailerLength, endOffset });
    position = endOffset;
  }

  return chunks;
}

export interface LocatedChain {
  readonly startOffset: number;
  readonly chunks: readonly EncoreChunk[];
  readonly endsAtFileEnd: boolean;
}

/**
 * Encontra a cadeia de blocos mais longa nos primeiros 8 KiB.
 *
 * Provisório: existe até o cabeçalho `SCOW` revelar o offset real do primeiro bloco.
 */
export function locateChunkChain(data: Uint8Array): LocatedChain {
  let best: LocatedChain = { startOffset: 0, chunks: [], endsAtFileEnd: false };
  const limit = Math.min(data.length, 8192);

  for (let start = 0; start < limit; start += 1) {
    let chunks: EncoreChunk[];
    try {
      chunks = readChunkChain(data, start);
    } catch {
      continue;
    }
    if (chunks.length < 3) continue;

    const last = chunks[chunks.length - 1];
    const endsAtFileEnd = last !== undefined && last.endOffset === data.length;

    if (
      chunks.length > best.chunks.length ||
      (endsAtFileEnd && !best.endsAtFileEnd && chunks.length >= best.chunks.length)
    ) {
      best = { startOffset: start, chunks, endsAtFileEnd };
    }
  }

  return best;
}

function readTag(data: Uint8Array, offset: number): string | null {
  let tag = '';
  for (let index = 0; index < 4; index += 1) {
    const byte = data[offset + index];
    if (byte === undefined) return null;
    tag += String.fromCharCode(byte);
  }
  return TAG_PATTERN.test(tag) ? tag : null;
}

function readUint32(data: Uint8Array, offset: number): number {
  const b0 = data[offset];
  const b1 = data[offset + 1];
  const b2 = data[offset + 2];
  const b3 = data[offset + 3];
  if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
    throw new ChunkFormatError('Bloco truncado: não há 4 bytes de tamanho.', offset);
  }
  return b0 + (b1 << 8) + (b2 << 16) + ((b3 << 24) >>> 0);
}
