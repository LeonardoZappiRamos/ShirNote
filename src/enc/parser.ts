/**
 * Parser `.enc` de produto (Fase 2, tarefa 2.3).
 *
 * Usa só campos comprovados em `docs/enc-format.md` (v0.9). O que o arquivo traz e o modelo ainda
 * não representa vira `ParseWarning` (modo tolerante, RF-11); arquivo incompatível vira
 * `EncoreFormatError` (RF-03).
 */
import type {
  Barline,
  Clef,
  Direction,
  Dots,
  Measure,
  MusicEvent,
  Note,
  NoteValue,
  Part,
  Pitch,
  Score,
  Step,
  Voice,
} from '../music';
import { ChunkFormatError, readChunkChain, type EncoreChunk } from './container';
import {
  EncoreFormatError,
  type EncoreParseResult,
  type EncoreParser,
  type ParseWarning,
} from './types';

/** Única versão suportada no MVP (ADR 0002). */
const SUPPORTED_VERSION = 0xc4;
const TRACK_START = 0xc2;
const TRACK_SIZE = 0x86e;
const MEASURE_HEADER = 54;
const STAFF_ENTRY = 30;
const LINE_HEADER = 26;
const TITLE_SLOT = 1056;

/** Figura (`+5`) → figura do modelo e duração em semínimas. */
const FIGURES: Readonly<Record<number, readonly [NoteValue, number]>> = {
  0x20: ['breve', 8],
  1: ['whole', 4],
  2: ['half', 2],
  3: ['quarter', 1],
  4: ['eighth', 0.5],
  5: ['16th', 0.25],
  6: ['32nd', 0.125],
  7: ['64th', 0.0625],
};

/** Clave (`LINE +1`, evento `0x10 +5`) e índice diatônico de `y = 0`. */
const CLEFS: Readonly<Record<number, { readonly clef: Clef; readonly base: number }>> = {
  0: { clef: { sign: 'G', line: 2 }, base: 4 * 7 },
  1: { clef: { sign: 'F', line: 4 }, base: 2 * 7 + 2 },
  2: { clef: { sign: 'C', line: 3 }, base: 3 * 7 + 1 },
  3: { clef: { sign: 'C', line: 4 }, base: 2 * 7 + 6 },
  4: { clef: { sign: 'G', line: 2, octaveChange: 1 }, base: 5 * 7 },
};

const DOT_FACTORS = [1, 1.5, 1.75];
const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURALS = [0, 2, 4, 5, 7, 9, 11];

interface StaffEntry {
  readonly clef: number;
  readonly key: number;
  /** Repetido no `+4` de cada evento da pauta. */
  readonly id: number;
}

interface System {
  readonly measureCount: number;
  readonly staves: readonly StaffEntry[];
}

interface RawEvent {
  readonly tick: number;
  readonly type: number;
  readonly body: Uint8Array;
}

interface RawMeasure {
  readonly beats: number;
  readonly beatType: number;
  readonly barline?: Barline;
  readonly events: readonly RawEvent[];
}

/** Onde cada pauta global do arquivo cai: parte e pauta dentro dela (1 = superior). */
interface StaffSlot {
  readonly part: number;
  readonly staff: number;
}

export const encoreParser: EncoreParser = { parse: (data) => parseEncore(new Uint8Array(data)) };

/**
 * RNF-02: qualquer entrada ruim vira `EncoreFormatError`.
 *
 * As checagens internas cobrem o que já foi medido, mas o formato não tem especificação: se alguma
 * leitura escapar do previsto, o usuário recebe "arquivo corrompido" em vez de um `RangeError` sem
 * explicação. O erro original não é engolido em silêncio — a mensagem diz que a estrutura é inesperada.
 */
export function parseEncore(bytes: Uint8Array): EncoreParseResult {
  try {
    return parseBody(bytes);
  } catch (error) {
    if (error instanceof EncoreFormatError) throw error;
    throw new EncoreFormatError(
      'corrupt',
      'O arquivo está corrompido: a estrutura não é a esperada.',
    );
  }
}

function parseBody(bytes: Uint8Array): EncoreParseResult {
  const warnings = new Warnings();
  if (bytes.length < TRACK_START || ascii(bytes, 0, 4) !== 'SCOW') {
    throw new EncoreFormatError('not-encore', 'O arquivo não é uma partitura do Encore.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = bytes[4];
  if (version !== SUPPORTED_VERSION) {
    throw new EncoreFormatError(
      'unsupported-version',
      `Esta versão do Encore (0x${(version ?? 0).toString(16)}) ainda não é suportada.`,
    );
  }

  const ticksPerQuarter = view.getUint16(0x2c, true);
  const systemCount = view.getUint16(0x2e, true);
  const partCount = bytes[0x32] ?? 0;
  const staffCount = bytes[0x33] ?? 0;
  const measureCount = view.getUint16(0x34, true);
  for (let part = 0; part < partCount; part += 1) {
    const offset = TRACK_START + part * TRACK_SIZE;
    if (ascii(bytes, offset, 4) !== 'TK00') corrupt(`a parte ${part + 1} não tem registro TK00`);
  }

  let chunks: EncoreChunk[];
  try {
    chunks = readChunkChain(bytes, TRACK_START + partCount * TRACK_SIZE);
  } catch (error) {
    if (error instanceof ChunkFormatError) {
      throw new EncoreFormatError('truncated', 'O arquivo está incompleto.');
    }
    throw error;
  }
  const last = chunks[chunks.length - 1];
  if (!last || last.endOffset !== bytes.length) corrupt('a cadeia de blocos não fecha no fim');

  const systems: System[] = [];
  const measures: RawMeasure[] = [];
  let title = '';
  let composer = '';
  for (const chunk of chunks) {
    const payload = chunk.offset + 8;
    if (chunk.tag === 'LINE') {
      if ((chunk.payloadLength - LINE_HEADER) / STAFF_ENTRY !== staffCount) {
        corrupt('um sistema não tem uma entrada por pauta');
      }
      systems.push({
        measureCount: view.getUint32(payload + 12, true),
        staves: Array.from({ length: staffCount }, (_, staff) => {
          const entry = payload + LINE_HEADER + staff * STAFF_ENTRY;
          return {
            clef: byte(bytes, entry + 1),
            key: byte(bytes, entry + 2),
            id: byte(bytes, entry + 8),
          };
        }),
      });
    } else if (chunk.tag === 'MEAS') {
      measures.push({
        beats: byte(bytes, payload + 8),
        beatType: byte(bytes, payload + 9),
        barline: barlineOf(bytes, payload),
        events: readEvents(bytes, view, payload + MEASURE_HEADER, chunk.endOffset, measures.length),
      });
    } else if (chunk.tag === 'TITL') {
      title = utf16At(view, payload + 32);
      composer = utf16At(view, payload + 32 + 6 * TITLE_SLOT);
    }
  }

  if (measures.length !== measureCount)
    corrupt('o número de compassos não confere com o cabeçalho');
  if (systems.length !== systemCount) corrupt('o número de sistemas não confere com o cabeçalho');
  if (systems.reduce((total, system) => total + system.measureCount, 0) !== measures.length) {
    corrupt('os sistemas não somam o número de compassos');
  }
  const first = systems[0];
  if (!first || measures.length === 0) corrupt('a partitura não tem compassos');

  const slots = staffSlots(first.staves);
  const partSizes = Array.from(
    { length: Math.max(...slots.map((slot) => slot.part)) + 1 },
    (_, part) => slots.filter((slot) => slot.part === part).length,
  );
  if (partSizes.length > 2) {
    warnings.add('many-parts', 'Mais de duas partes: a divisão em partes ainda não tem amostra.');
  }

  const decoded = decodeMeasures(measures, systems, slots, partSizes, ticksPerQuarter, warnings);
  const parts: Part[] = partSizes.map((staves, part) => ({
    id: `P${part + 1}`,
    name: `Parte ${part + 1}`,
    ...(staves > 1 ? { staves } : {}),
    measures: decoded.map((measure) => measure[part] as Measure),
  }));

  const score: Score = {
    ...(title ? { title } : {}),
    ...(composer ? { composer } : {}),
    parts,
  };
  return { score, warnings: warnings.list() };
}

/**
 * Parte e pauta de cada entrada de `LINE`, pelo `+8`. Hipótese: bits 0–5 = parte, bits 6–7 = pauta
 * na parte (`controle-16`, `17`, `24`; docs/enc-format.md seção 5).
 */
function staffSlots(staves: readonly StaffEntry[]): StaffSlot[] {
  const seen = new Map<number, number>();
  return staves.map((entry) => {
    const part = entry.id & 0x3f;
    const staff = (seen.get(part) ?? 0) + 1;
    seen.set(part, staff);
    return { part, staff };
  });
}

function decodeMeasures(
  measures: readonly RawMeasure[],
  systems: readonly System[],
  slots: readonly StaffSlot[],
  partSizes: readonly number[],
  ticksPerQuarter: number,
  warnings: Warnings,
): Measure[][] {
  const gate = gateOf(measures, ticksPerQuarter);
  let system = -1;
  let left = 0;
  let staves: readonly StaffEntry[] = [];
  let clefs: number[] = [];
  let keys: number[] = [];

  return measures.map((measure, index) => {
    while (left === 0) {
      system += 1;
      staves = systems[system]?.staves ?? [];
      left = systems[system]?.measureCount ?? 1;
      clefs = staves.map((entry) => entry.clef);
      keys = staves.map((entry) => entry.key);
    }
    left -= 1;
    const number = index + 1;
    const staffOf = (body: Uint8Array): number => {
      const staff = staves.findIndex((entry) => entry.id === body[4]);
      if (staff >= 0) return staff;
      warnings.add(
        'unknown-staff',
        `Compasso ${number}: evento em pauta desconhecida, posto na primeira.`,
      );
      return 0;
    };

    // Troca de armadura (0x20) e de clave (0x10): `+5` = código novo. A clave vale a partir do tick.
    const clefChanges: { tick: number; staff: number; clef: number }[] = [];
    for (const event of measure.events) {
      if (event.type === 0x20) keys[staffOf(event.body)] = byte(event.body, 5);
      if (event.type === 0x10) {
        clefChanges.push({
          tick: event.tick,
          staff: staffOf(event.body),
          clef: byte(event.body, 5),
        });
        if (event.tick > 0) {
          // ponytail: o modelo só tem clave no início do compasso; mostrar a troca no ponto exato
          // exige evento de clave dentro da voz.
          warnings.add(
            'clef-mid-measure',
            'Troca de clave no meio do compasso aparece no início dele.',
          );
        }
      }
    }
    clefChanges.sort((a, b) => a.tick - b.tick);
    const startClefs = [...clefs];
    const clefAt = (staff: number, tick: number): number => {
      let clef = startClefs[staff] ?? 0;
      for (const change of clefChanges)
        if (change.staff === staff && change.tick <= tick) clef = change.clef;
      return clef;
    };
    for (const change of clefChanges) clefs[change.staff] = change.clef;

    // Eventos de cada parte, agrupados por voz (nibble baixo do tipo + 1).
    const voices = partSizes.map(() => new Map<number, MusicEvent[]>());
    const filled = slots.map(() => false);
    // No mesmo tick, a nota de acorde (`+6` bit 0x40) pode vir antes da principal no arquivo.
    const chordOf = (event: RawEvent) =>
      (event.type & 0xf0) === 0x90 ? byte(event.body, 6) & 0x40 : 0;
    const ordered = [...measure.events].sort((a, b) => a.tick - b.tick || chordOf(a) - chordOf(b));
    const positions = new Map<string, number>();
    // Barra de colcheia (0x40 + voz − 1): do tick do evento até o tick em `+20`. As entradas
    // seguintes (`+5` > 1) são barras secundárias, que o renderizador deduz das durações.
    const beams = measure.events
      .filter((event) => (event.type & 0xf0) === 0x40)
      .map((event) => ({
        staff: staffOf(event.body),
        voice: (event.type & 0x0f) + 1,
        start: event.tick,
        end: uint16(event.body, 20),
      }));
    const directions: Direction[] = [];
    for (const event of ordered) {
      const kind = event.type & 0xf0;
      if (kind !== 0x90 && kind !== 0x80) {
        // 0x30 é a curva de uma ligadura de valor, que já sai das flags da nota (`+6`).
        if (event.type === 0x50) {
          const direction = directionOf(event, ticksPerQuarter, warnings);
          if (direction) directions.push(direction);
        } else if (
          event.type !== 0x10 &&
          event.type !== 0x20 &&
          event.type !== 0x30 &&
          kind !== 0x40
        ) {
          warnings.add(`event-${event.type}`, ignoredMessage(event.type));
        }
        continue;
      }
      const globalStaff = staffOf(event.body);
      const slot = slots[globalStaff] ?? { part: 0, staff: 1 };
      const voice = (event.type & 0x0f) + 1;
      const group = beams.find(
        (beam) =>
          beam.staff === globalStaff &&
          beam.voice === voice &&
          beam.start <= event.tick &&
          event.tick <= beam.end,
      );
      // A barra fica só na nota principal do acorde, como no MusicXML do Encore.
      const beam =
        kind !== 0x90 || !group || chordOf(event)
          ? undefined
          : event.tick === group.start
            ? 'begin'
            : event.tick === group.end
              ? 'end'
              : 'continue';
      const music =
        kind === 0x90
          ? noteOf(
              event,
              slot.staff,
              CLEFS[clefAt(globalStaff, event.tick)],
              gate,
              ticksPerQuarter,
              number,
              warnings,
              beam,
            )
          : restOf(event, slot.staff, ticksPerQuarter, number, warnings);
      filled[globalStaff] = true;

      // O modelo é sequencial: um buraco ou sobreposição na voz desloca o que vem depois.
      const key = `${slot.part}/${voice}`;
      if (!(music.type === 'note' && music.chord)) {
        const position = positions.get(key) ?? 0;
        if (event.tick !== position) {
          warnings.add('voice-gap', `Compasso ${number}: voz ${voice} com buraco ou sobreposição.`);
        }
        const dots = DOT_FACTORS[music.duration.dots ?? 0] ?? 1;
        positions.set(
          key,
          event.tick + Math.round(nominalTicks(event.body, ticksPerQuarter) * dots),
        );
      }
      const list = voices[slot.part]?.get(voice) ?? [];
      list.push(music);
      voices[slot.part]?.set(voice, list);
    }

    // Compasso sem evento algum: pausa de compasso inteiro em cada pauta (a voz 1 da pauta 2 do
    // Encore é a 5). Pauta vazia ao lado de outra com notas fica vazia, como no MusicXML do Encore.
    slots.forEach((slot) => {
      if (filled.some(Boolean)) return;
      const voice = 1 + (slot.staff - 1) * 4;
      const list = voices[slot.part]?.get(voice) ?? [];
      list.push({ type: 'rest', duration: { value: 'whole' }, ...staffField(slot.staff) });
      voices[slot.part]?.set(voice, list);
    });

    return partSizes.map((_, part): Measure => {
      const partStaves = slots.flatMap((slot, globalStaff) =>
        slot.part === part ? [globalStaff] : [],
      );
      const firstStaff = partStaves[0] ?? 0;
      const partVoices: Voice[] = [...(voices[part] ?? new Map<number, MusicEvent[]>())]
        .sort(([a], [b]) => a - b)
        .map(([voice, events]) => ({ id: String(voice), events }));
      return {
        number,
        ...(measure.barline ? { barline: measure.barline } : {}),
        ...(part === 0 && directions.length > 0 ? { directions } : {}),
        attributes: {
          key: { fifths: fifthsOf(keys[firstStaff] ?? 0, warnings) },
          time: { beats: measure.beats, beatType: measure.beatType },
          clefs: partStaves.map((staff) => clefOf(clefs[staff] ?? 0, warnings).clef),
        },
        voices: partVoices,
      };
    });
  });
}

/**
 * Símbolo (0x50 de 16 bytes, código em `+5`): A2 = segno, A6 = coda, CC = dinâmica. O de 86 bytes é
 * texto, guardado no bloco `TEXT` (docs/enc-format.md seção 7).
 */
function directionOf(
  event: RawEvent,
  ticksPerQuarter: number,
  warnings: Warnings,
): Direction | undefined {
  const code = byte(event.body, 5);
  const symbol = event.body.length === 16 ? SYMBOLS[code] : undefined;
  if (symbol) return { symbol, offset: event.tick / ticksPerQuarter };
  if (event.body.length !== 16) warnings.add('text', 'Ainda não exibidos: textos.');
  else if (code === 0xcc) warnings.add('dynamics', 'Ainda não exibidas: dinâmicas.');
  else warnings.add('symbol', 'Ainda não exibidos: alguns símbolos.');
  return undefined;
}

const SYMBOLS: Readonly<Record<number, Direction['symbol']>> = { 0xa2: 'segno', 0xa6: 'coda' };

/** Cabeçalho de `MEAS`: `+12` = 2 início de repetição; `+13` = 4 fim de repetição, 5 final, 6 dupla;
 * `+14` = C0 casa, com o número em `+15` (docs/enc-format.md seção 6). */
function barlineOf(bytes: Uint8Array, payload: number): Barline | undefined {
  const end = ({ 4: 'repeat', 5: 'final', 6: 'double' } as const)[
    byte(bytes, payload + 13) as 4 | 5 | 6
  ];
  const barline: Barline = {
    ...(byte(bytes, payload + 12) === 2 ? { repeatStart: true } : {}),
    ...(end ? { end } : {}),
    ...(byte(bytes, payload + 14) === 0xc0 ? { ending: byte(bytes, payload + 15) } : {}),
  };
  return Object.keys(barline).length > 0 ? barline : undefined;
}

function noteOf(
  event: RawEvent,
  staff: number,
  clef: (typeof CLEFS)[number] | undefined,
  gate: number,
  ticksPerQuarter: number,
  number: number,
  warnings: Warnings,
  beam: Note['beam'],
): Note {
  const { body } = event;
  if (!clef) warnings.add('unknown-clef', 'Clave sem amostra: notas lidas como clave de sol.');
  const diatonic =
    (clef ?? CLEFS[0]!).base + new DataView(body.buffer, body.byteOffset).getInt8(12);
  const degree = ((diatonic % 7) + 7) % 7;
  const octave = Math.floor(diatonic / 7);
  let alter = byte(body, 15) - ((NATURALS[degree] ?? 0) + (octave + 1) * 12);
  if (Math.abs(alter) > 2) {
    warnings.add('alter', `Compasso ${number}: alteração fora da faixa, nota lida sem acidente.`);
    alter = 0;
  }
  const flags = byte(body, 6);
  const tie =
    (flags & 0x03) === 0x03
      ? 'continue'
      : flags & 0x01
        ? 'start'
        : flags & 0x02
          ? 'stop'
          : undefined;
  const pitch: Pitch = {
    step: STEPS[degree] ?? 'C',
    octave,
    ...(alter ? { alter: alter as Pitch['alter'] } : {}),
  };
  return {
    type: 'note',
    pitch,
    duration: durationOf(body, gate, ticksPerQuarter, number, warnings),
    ...staffField(staff),
    ...(tie ? { tie } : {}),
    ...(flags & 0x40 ? { chord: true } : {}),
    ...(beam ? { beam } : {}),
  };
}

function restOf(
  event: RawEvent,
  staff: number,
  ticksPerQuarter: number,
  number: number,
  warnings: Warnings,
): MusicEvent {
  // A duração da pausa é a escrita: fator 1.
  return {
    type: 'rest',
    duration: durationOf(event.body, 1, ticksPerQuarter, number, warnings),
    ...staffField(staff),
  };
}

const staffField = (staff: number) => (staff > 1 ? { staff } : {});

/** Figura, ponto (deduzido de `duração / nominal / fator`) e quiáltera (`+13`). */
function durationOf(
  body: Uint8Array,
  gate: number,
  ticksPerQuarter: number,
  number: number,
  warnings: Warnings,
) {
  const figure = FIGURES[byte(body, 5)];
  if (!figure)
    warnings.add('unknown-figure', `Compasso ${number}: figura sem amostra lida como semínima.`);
  const [value] = figure ?? FIGURES[3]!;
  const tuplet = byte(body, 13);
  const ratio = uint16(body, 16) / nominalTicks(body, ticksPerQuarter) / gate;
  let dots: Dots = 0;
  if (Math.abs(ratio - 1.5) < 0.02) dots = 1;
  else if (Math.abs(ratio - 1.75) < 0.02) dots = 2;
  else if (Math.abs(ratio - 1) >= 0.02) {
    warnings.add('duration', `Compasso ${number}: duração que não corresponde à figura.`);
  }
  return {
    value,
    ...(dots ? { dots } : {}),
    ...(tuplet ? { tuplet: { actual: tuplet >> 4, normal: tuplet & 0x0f } } : {}),
  };
}

/** Duração nominal em ticks, já com a quiáltera, sem ponto. */
function nominalTicks(body: Uint8Array, ticksPerQuarter: number): number {
  const quarters = (FIGURES[byte(body, 5)] ?? FIGURES[3]!)[1];
  const tuplet = byte(body, 13);
  const actual = tuplet >> 4;
  return quarters * ticksPerQuarter * (actual === 0 ? 1 : (tuplet & 0x0f) / actual);
}

/** Fator de execução: a razão mais frequente entre duração tocada e nominal (seção 7). */
function gateOf(measures: readonly RawMeasure[], ticksPerQuarter: number): number {
  const counts = new Map<number, number>();
  for (const measure of measures) {
    for (const event of measure.events) {
      if ((event.type & 0xf0) !== 0x90) continue;
      const ratio =
        Math.round((uint16(event.body, 16) / nominalTicks(event.body, ticksPerQuarter)) * 1000) /
        1000;
      counts.set(ratio, (counts.get(ratio) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1;
}

/** Armadura: 0 = sem acidentes, 1–7 = bemóis, 8–14 = 1–7 sustenidos. */
function fifthsOf(code: number, warnings: Warnings): number {
  if (code <= 7) return -code;
  if (code <= 14) return code - 7;
  warnings.add('unknown-key', 'Armadura sem amostra, lida como sem acidentes.');
  return 0;
}

function clefOf(code: number, warnings: Warnings) {
  const clef = CLEFS[code];
  if (clef) return clef;
  warnings.add('unknown-clef', 'Clave sem amostra: notas lidas como clave de sol.');
  return CLEFS[0]!;
}

function readEvents(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
  index: number,
): RawEvent[] {
  const events: RawEvent[] = [];
  let position = start;
  for (;;) {
    if (position + 2 > end) corrupt(`o compasso ${index + 1} não termina em FF FF`);
    const tick = view.getUint16(position, true);
    if (tick === 0xffff) break;
    const size = byte(bytes, position + 3);
    if (size < 4 || position + size > end) corrupt(`o compasso ${index + 1} tem evento inválido`);
    events.push({
      tick,
      type: byte(bytes, position + 2),
      body: bytes.subarray(position, position + size),
    });
    position += size;
  }
  if (position + 2 !== end) corrupt(`o compasso ${index + 1} tem bytes depois do fim`);
  return events;
}

const IGNORED: Readonly<Record<number, string>> = {};

function ignoredMessage(type: number): string {
  const name = IGNORED[type];
  return name
    ? `Ainda não exibido: ${name}.`
    : `Evento 0x${type.toString(16)} desconhecido ignorado.`;
}

/** Avisos sem repetição: o primeiro de cada código vale para o arquivo inteiro. */
class Warnings {
  private readonly byCode = new Map<string, ParseWarning>();

  add(code: string, message: string): void {
    if (!this.byCode.has(code)) this.byCode.set(code, { code, message });
  }

  list(): ParseWarning[] {
    return [...this.byCode.values()];
  }
}

function corrupt(detail: string): never {
  throw new EncoreFormatError('corrupt', `O arquivo está corrompido: ${detail}.`);
}

function byte(bytes: Uint8Array, offset: number): number {
  return bytes[offset] ?? 0;
}

function uint16(bytes: Uint8Array, offset: number): number {
  return byte(bytes, offset) | (byte(bytes, offset + 1) << 8);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function utf16At(view: DataView, offset: number): string {
  let text = '';
  for (let position = offset; position + 1 < view.byteLength; position += 2) {
    const unit = view.getUint16(position, true);
    if (unit === 0) break;
    text += String.fromCharCode(unit);
  }
  return text;
}
