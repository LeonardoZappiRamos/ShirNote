#!/usr/bin/env node
/**
 * Spike de parser `.enc` (Fase 1, tarefa 1.4): prova de que o formato é legível.
 *
 * Descartável: o parser de produto entra em `src/enc` na Fase 2. Layout em docs/enc-format.md.
 *
 * Uso:
 *   node scripts/enc-spike.mjs arquivo.enc
 *   node scripts/enc-spike.mjs arquivo.enc --check referencia.xml
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TRACK_START = 0xc2;
const TRACK_SIZE = 0x86e;
const MEASURE_HEADER = 54;
const STEPS = 'CDEFGAB';
const NATURALS = [0, 2, 4, 5, 7, 9, 11];
/** Figura → tipo MusicXML e duração nominal em ticks (240 por semínima). */
const FIGURES = {
  0x20: ['breve', 1920],
  1: ['whole', 960],
  2: ['half', 480],
  3: ['quarter', 240],
  4: ['eighth', 120],
  5: ['16th', 60],
  6: ['32nd', 30],
  7: ['64th', 15],
};
/**
 * Índice diatônico (oitava × 7 + grau) de `y = 0`, seis graus abaixo da linha central. Só estas
 * claves têm amostra; "+1" é a clave oitavada acima.
 */
const CLEF_BASE = { 0: 4 * 7, 1: 2 * 7 + 2, 2: 3 * 7 + 1, 3: 2 * 7 + 6, 4: 5 * 7 };
const CLEF_NAMES = { 0: 'G2', 1: 'F4', 2: 'C3', 3: 'C4', 4: 'G2+1' };
const TITLE_SLOT = 1056;

function fail(message) {
  throw new Error(message);
}

/** Armadura: 0 = sem acidentes, 1–7 = bemóis, 8–14 = 1–7 sustenidos. */
function fifthsOf(code, warnings) {
  if (code <= 7) return -code;
  if (code <= 14) return code - 7;
  warnings.add(`armadura com código ${code} sem amostra; assumida sem acidentes`);
  return 0;
}

function textAt(bytes, offset) {
  let text = '';
  for (let position = offset; position + 1 < bytes.length; position += 2) {
    const unit = bytes.readUInt16LE(position);
    if (unit === 0) break;
    text += String.fromCharCode(unit);
  }
  return text;
}

function readEvents(bytes, start, end, index) {
  const events = [];
  let position = start;
  while (true) {
    if (position + 2 > end) fail(`compasso ${index}: lista de eventos sem terminador FF FF`);
    const tick = bytes.readUInt16LE(position);
    if (tick === 0xffff) break;
    const size = bytes[position + 3];
    if (size < 4 || position + size > end) fail(`compasso ${index}: evento inválido`);
    events.push({
      tick,
      type: bytes[position + 2],
      body: bytes.subarray(position, position + size),
    });
    position += size;
  }
  if (position + 2 !== end) fail(`compasso ${index}: há bytes depois do terminador`);
  return events;
}

function parse(bytes) {
  if (bytes.toString('latin1', 0, 4) !== 'SCOW') fail('magic SCOW ausente');

  const warnings = new Set();
  const partCount = bytes[0x32];
  const staffCount = bytes[0x33];
  const start = TRACK_START + partCount * TRACK_SIZE;
  for (let part = 0; part < partCount; part += 1) {
    const offset = TRACK_START + part * TRACK_SIZE;
    if (bytes.toString('latin1', offset, offset + 4) !== 'TK00') fail(`parte ${part} sem TK00`);
    if (bytes.readUInt16LE(offset + 6) !== part) fail(`TK00 da parte ${part} com índice errado`);
  }

  const systems = [];
  const measures = [];
  let title = '';
  let subtitle = '';
  let author = '';
  let position = start;
  while (position < bytes.length) {
    if (position + 8 > bytes.length) fail('bloco truncado');
    const tag = bytes.toString('latin1', position, position + 4);
    if (!/^[A-Z][A-Z0-9]{3}$/.test(tag)) fail(`tag inválida em 0x${position.toString(16)}`);
    const payload = position + 8;
    const length = bytes.readUInt32LE(position + 4);
    const end = payload + length + (tag === 'MEAS' ? MEASURE_HEADER : 0);
    if (end > bytes.length) fail(`bloco ${tag} além do fim do arquivo`);

    if (tag === 'LINE') {
      if ((length - 26) / 30 !== staffCount) fail('LINE não tem uma entrada por pauta');
      systems.push({
        measureCount: bytes.readUInt32LE(payload + 12),
        staves: Array.from({ length: staffCount }, (_, staff) => ({
          clef: bytes[payload + 26 + staff * 30 + 1],
          key: bytes[payload + 26 + staff * 30 + 2],
          id: bytes[payload + 26 + staff * 30 + 8],
        })),
      });
    } else if (tag === 'MEAS') {
      measures.push({
        ticks: bytes.readUInt16LE(payload + 6),
        beats: bytes[payload + 8],
        beatType: bytes[payload + 9],
        repeatStart: bytes[payload + 12] === 2,
        repeatEnd: bytes[payload + 13] === 4,
        finalBar: bytes[payload + 13] === 5,
        doubleBar: bytes[payload + 13] === 6,
        ending: bytes[payload + 14] === 0xc0 ? bytes[payload + 15] : 0,
        events: readEvents(bytes, payload + MEASURE_HEADER, end, measures.length),
      });
    } else if (tag === 'TITL') {
      // Campos de 1056 bytes, texto UTF-16LE em +32: 0 título, 1 texto, 6 autor.
      title = textAt(bytes, payload + 32);
      subtitle = textAt(bytes, payload + 32 + TITLE_SLOT);
      author = textAt(bytes, payload + 32 + 6 * TITLE_SLOT);
    }
    position = end;
  }

  if (bytes.readUInt16LE(0x34) !== measures.length) fail('contagem de compassos diverge de 0x34');
  if (bytes.readUInt16LE(0x2e) !== systems.length) fail('contagem de sistemas diverge de 0x2E');
  const inSystems = systems.reduce((total, system) => total + system.measureCount, 0);
  if (inSystems !== measures.length) fail('soma de LINE +12 diverge do número de compassos');

  return {
    partCount,
    staffCount,
    title,
    subtitle,
    author,
    systems,
    measures: decode(measures, systems, staffCount, warnings),
    warnings,
  };
}

/** Tipo do evento: nibble alto 0x9 = nota, 0x8 = pausa; nibble baixo = voz − 1. */
const isNote = (event) => (event.type & 0xf0) === 0x90;
const isRest = (event) => (event.type & 0xf0) === 0x80;

/** `+13`: quiáltera, nibble alto = notas tocadas, baixo = notas normais (0x32 = 3:2). */
function tupletOf(body) {
  return body[13] === 0 ? '' : `${body[13] >> 4}:${body[13] & 0x0f}`;
}

/** Duração nominal em ticks, já reduzida pela quiáltera. */
function nominalOf(body) {
  const entry = FIGURES[body[5]];
  if (!entry) fail(`figura com código ${body[5]} sem amostra`);
  const actual = body[13] >> 4;
  return actual === 0 ? entry[1] : (entry[1] * (body[13] & 0x0f)) / actual;
}

/** Razão mais frequente entre duração gravada e nominal: o quanto a nota soa de fato. */
function gateOf(measures) {
  const counts = new Map();
  for (const measure of measures) {
    for (const event of measure.events) {
      if (!isNote(event)) continue;
      const ratio = event.body.readUInt16LE(16) / nominalOf(event.body);
      const key = Math.round(ratio * 1000) / 1000;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1;
}

function dotsOf(body, gate, warnings) {
  const duration = body.readUInt16LE(16);
  const figure = body[5];
  const ratio = duration / nominalOf(body) / gate;
  if (Math.abs(ratio - 1) < 0.02) return 0;
  if (Math.abs(ratio - 1.5) < 0.02) return 1;
  if (Math.abs(ratio - 1.75) < 0.02) return 2;
  warnings.add(`duração ${duration} não corresponde à figura ${figure}`);
  return 0;
}

/**
 * Pauta do evento: a entrada de `LINE` cujo `+8` é igual ao `+4` do evento (`controle-16`, `17`, `24`).
 * Hipótese: o valor é `pauta na parte << 6 | parte`.
 */
const staffOf = (body, staves) => {
  const staff = staves.findIndex((entry) => entry.id === body[4]);
  if (staff < 0) fail(`evento com pauta 0x${body[4].toString(16)} fora de LINE`);
  return staff + 1;
};

function decode(measures, systems, staffCount, warnings) {
  const gate = gateOf(measures);
  const unknown = new Map();
  let system = -1;
  let left = 0;
  let clefs = [];
  let key;

  const decoded = measures.map((measure, index) => {
    while (left === 0) {
      system += 1;
      left = systems[system].measureCount;
      clefs = systems[system].staves.map((staff) => staff.clef);
      key = systems[system].staves[0].key;
    }
    left -= 1;

    // Troca de armadura (0x20, `+5` = código novo, `+10` = anterior) vale até o fim do sistema.
    for (const event of measure.events) {
      if (event.type === 0x20 && staffOf(event.body, systems[system].staves) === 1)
        key = event.body[5];
    }

    // Troca de clave (0x10, `+5` = código) vale a partir do seu tick, mesmo para eventos do mesmo
    // tick gravados antes dela.
    const changes = measure.events
      .filter((event) => event.type === 0x10)
      .map((event) => ({
        tick: event.tick,
        staff: staffOf(event.body, systems[system].staves),
        clef: event.body[5],
      }))
      .sort((a, b) => a.tick - b.tick);
    const start = [...clefs];
    const clefAt = (staff, tick) => {
      let clef = start[staff - 1];
      for (const change of changes) {
        if (change.staff === staff && change.tick <= tick) clef = change.clef;
      }
      return clef;
    };
    for (const change of changes) clefs[change.staff - 1] = change.clef;

    const events = [];
    for (const event of measure.events) {
      if (isNote(event)) {
        const staff = staffOf(event.body, systems[system].staves);
        const clef = clefAt(staff, event.tick);
        const base = CLEF_BASE[clef];
        if (base === undefined) fail(`clave com código ${clef} sem amostra`);
        const y = event.body.readInt8(12);
        const pitch = event.body[15];
        const flags = event.body[6];
        const diatonic = base + y;
        const degree = diatonic % 7;
        const octave = Math.floor(diatonic / 7);
        const alter = pitch - (NATURALS[degree] + (octave + 1) * 12);
        if (Math.abs(alter) > 2) warnings.add(`compasso ${index}: alteração ${alter}`);
        events.push({
          kind: 'note',
          tick: event.tick,
          staff,
          voice: (event.type & 0x0f) + 1,
          step: STEPS[degree],
          octave,
          alter,
          type: FIGURES[event.body[5]]?.[0],
          dots: dotsOf(event.body, gate, warnings),
          tuplet: tupletOf(event.body),
          chord: (flags & 0x40) !== 0,
          tieStart: (flags & 0x01) !== 0,
          tieStop: (flags & 0x02) !== 0,
        });
      } else if (isRest(event)) {
        events.push({
          kind: 'rest',
          tick: event.tick,
          staff: staffOf(event.body, systems[system].staves),
          voice: (event.type & 0x0f) + 1,
          type: FIGURES[event.body[5]]?.[0],
          dots: dotsOf(event.body, 1, warnings),
          tuplet: tupletOf(event.body),
        });
      } else if (event.type !== 0x10 && event.type !== 0x20) {
        const label = `0x${event.type.toString(16)}`;
        unknown.set(label, (unknown.get(label) ?? 0) + 1);
      }
    }
    // Compasso sem evento algum é pausa de compasso inteiro implícita, uma por pauta.
    if (events.length === 0) {
      for (let staff = 1; staff <= staffCount; staff += 1) {
        events.push({ kind: 'rest', tick: 0, staff, type: 'whole', dots: 0, tuplet: '' });
      }
    }

    return { ...measure, clef: clefs[0], fifths: fifthsOf(key, warnings), events };
  });

  for (const [label, count] of unknown) warnings.add(`${count} evento(s) ${label} ignorados`);
  return decoded;
}

function orderKey(event) {
  return event.kind === 'rest' ? -1 : event.octave * 7 + STEPS.indexOf(event.step);
}

function byPosition(a, b) {
  return (
    a.tick - b.tick ||
    a.staff - b.staff ||
    orderKey(a) - orderKey(b) ||
    Number(a.chord ?? false) - Number(b.chord ?? false)
  );
}

/** Figura do MusicXML em semínimas. */
const REST_QUARTERS = {
  breve: 8,
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  '16th': 0.25,
  '32nd': 0.125,
};

const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiOf = (note) => (note.octave + 1) * 12 + SEMITONES[note.step] + note.alter;

function readReference(path) {
  // O Encore exporta em UTF-16LE (declarado no cabeçalho XML); exportações antigas vieram em UTF-8.
  const bytes = readFileSync(path);
  return readReferenceXml(
    bytes.toString(bytes[1] === 0 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''),
  );
}

/**
 * Lê um MusicXML (do Encore ou do ShirNote) na forma que `compare` usa. Com `beams`, cada nota traz
 * também a barra de colcheia principal (`<beam number="1">`); com `directions`, cada compasso traz
 * os segnos e codas, na ordem. O spike não lê nenhum dos dois.
 */
export function readReferenceXml(xml, { beams = false, directions = false } = {}) {
  const value = (text, pattern) => text.match(pattern)?.[1];
  const divisions = Number(value(xml, /<divisions>(\d+)/) ?? 0);
  // Armadura, fórmula e clave da pauta 1 em vigor ao fim de cada compasso.
  let fifths;
  let beats;
  let beatType;
  let clef;
  // Nota que começou ligadura, por pauta, voz e altura MIDI.
  const tied = new Map();
  const readMeasure = (body, staffOffset) => {
    fifths = Number(value(body, /<fifths>(-?\d+)/) ?? fifths);
    beats = Number(value(body, /<beats>(\d+)/) ?? beats);
    beatType = Number(value(body, /<beat-type>(\d+)/) ?? beatType);
    for (const [, staff, item] of body.matchAll(/<clef(?: number="(\d+)")?>([\s\S]*?)<\/clef>/g)) {
      if ((staff ?? '1') !== '1') continue;
      const octave = value(item, /<clef-octave-change>(-?\d+)/);
      clef = `${value(item, /<sign>(.)/)}${value(item, /<line>(\d+)/)}`;
      if (octave) clef += `${Number(octave) > 0 ? '+' : ''}${octave}`;
    }
    const events = [];
    // Um relógio por pauta: o Encore passa para a pauta 2 sem `<backup>`.
    const clocks = {};
    let current = 1;
    let last = 0;
    for (const [, name, item] of body.matchAll(/<(note|backup|forward)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const duration = Number(value(item, /<duration>(\d+)/) ?? 0);
      if (name === 'backup') clocks[current] -= duration;
      if (name === 'forward') clocks[current] += duration;
      if (name !== 'note') continue;
      current = Number(value(item, /<staff>(\d+)/) ?? 1);
      clocks[current] ??= 0;
      const tick = clocks[current];
      const chord = item.includes('<chord');
      if (!chord) last = tick;
      const ties = [...item.matchAll(/<tie type="(\w+)"/g)].map((match) => match[1]);
      const voice = value(item, /<voice>(\d+)/);
      const actual = value(item, /<actual-notes>(\d+)/);
      const common = {
        tick: last,
        staff: current + staffOffset,
        ...(voice === undefined ? {} : { voice: Number(voice) }),
        type: value(item, /<type>([^<]+)/) ?? 'whole',
        dots: (item.match(/<dot\/>/g) ?? []).length,
        tuplet: actual ? `${actual}:${value(item, /<normal-notes>(\d+)/)}` : '',
      };
      if (item.includes('<rest')) {
        // O Encore omite `<dot/>` em pausa pontuada, mas mantém a duração de 1,5 × a figura (54 pausas
        // em ANA BEKOACH e A VONTADE DO PAI). O ponto vem da duração. Pausa de compasso inteiro vem
        // sem `<type>` e fica de fora.
        const nominal = divisions * (REST_QUARTERS[common.type] ?? 0);
        const typed = item.includes('<type>');
        if (typed && common.dots === 0 && !actual && duration === nominal * 1.5) common.dots = 1;
        events.push({ kind: 'rest', ...common });
      } else {
        const note = {
          kind: 'note',
          ...common,
          step: value(item, /<step>(.)/),
          octave: Number(value(item, /<octave>(\d+)/)),
          alter: Number(value(item, /<alter>(-?\d+)/) ?? 0),
          chord,
          tieStart: ties.includes('start'),
          tieStop: ties.includes('stop'),
          ...(beams ? { beam: value(item, /<beam number="1">([^<]+)/) ?? '' } : {}),
        };
        // O Encore grafa pela armadura a nota que termina uma ligadura (C♯ ligado vira D♭ em ANA
        // BEKOACH - Trombone). No `.enc` ela tem o mesmo `y` da que começa; a grafia vem desta.
        const key = `${note.staff}/${note.voice}/${midiOf(note)}`;
        const start = tied.get(key);
        if (note.tieStop && start) Object.assign(note, { step: start.step, alter: start.alter });
        if (note.tieStart) tied.set(key, note);
        events.push(note);
      }
      if (!chord) clocks[current] += duration;
    }
    const right = body.match(/<barline location="right">([\s\S]*?)<\/barline>/)?.[1] ?? '';
    return {
      events: events.sort(byPosition),
      fifths,
      beats,
      beatType,
      clef,
      repeatStart: /repeat direction="forward"/.test(body),
      repeatEnd: right.includes('direction="backward"'),
      finalBar: right.includes('light-heavy') && !right.includes('direction="backward"'),
      doubleBar: right.includes('light-light'),
      ending: Number(value(body, /<ending[^>]*number="(\d+)"/) ?? 0),
      ...(directions
        ? { directions: [...body.matchAll(/<direction-type>\s*<(segno|coda)\b/g)].map((m) => m[1]) }
        : {}),
    };
  };
  // O `.enc` grava cada parte como pautas seguintes do mesmo sistema (`controle-11`); no MusicXML,
  // cada parte vira as pautas depois das da parte anterior. Armadura, clave e barras vêm da parte 1.
  let staffOffset = 0;
  const parts = [...xml.matchAll(/<part\s[^>]*>([\s\S]*?)<\/part>/g)].map(([, part]) => {
    const offset = staffOffset;
    staffOffset += Number(value(part, /<staves>(\d+)/) ?? 1);
    return [...part.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map(([, body]) =>
      readMeasure(body, offset),
    );
  });
  const [measures = [], ...others] = parts;
  for (const part of others) {
    part.forEach((measure, index) => measures[index]?.events.push(...measure.events));
  }
  for (const measure of measures) measure.events.sort(byPosition);
  return {
    measures,
    title: value(xml, /<work-title>([^<]*)/) ?? '',
    author: value(xml, /<creator type="composer">([^<]*)/) ?? '',
  };
}

/** Comparação elementar da seção 10 do PRD. Devolve as divergências encontradas. */
function compare(score, reference) {
  const problems = [];
  const expect = (label, actual, wanted) => {
    if (actual !== wanted) problems.push(`${label}: lido ${actual}, esperado ${wanted}`);
  };
  expect('título', score.title, reference.title);
  expect('autor', score.author, reference.author);
  expect('compassos', score.measures.length, reference.measures.length);

  score.measures.forEach((measure, index) => {
    const target = reference.measures[index];
    if (!target) return;
    expect(`compasso ${index} armadura`, measure.fifths, target.fifths);
    expect(`compasso ${index} numerador`, measure.beats, target.beats);
    expect(`compasso ${index} denominador`, measure.beatType, target.beatType);
    expect(`compasso ${index} clave`, CLEF_NAMES[measure.clef], target.clef);
    for (const field of ['repeatStart', 'repeatEnd', 'finalBar', 'doubleBar', 'ending']) {
      expect(`compasso ${index} ${field}`, measure[field], target[field]);
    }
    const wanted = target.events;
    const actual = [...measure.events].sort(byPosition);
    expect(`compasso ${index} eventos`, actual.length, wanted.length);
    actual.forEach((event, position) => {
      const other = wanted[position];
      if (!other) return;
      for (const field of Object.keys(other)) {
        expect(`compasso ${index} evento ${position} ${field}`, event[field], other[field]);
      }
    });
  });
  return problems;
}

function main() {
  const [file, flag, referencePath] = process.argv.slice(2);
  if (!file || (flag !== undefined && (flag !== '--check' || !referencePath))) {
    console.error('Uso: node scripts/enc-spike.mjs <arquivo.enc> [--check <referencia.xml>]');
    process.exit(2);
  }

  let score;
  try {
    score = parse(readFileSync(file));
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    process.exit(1);
  }

  const events = score.measures.flatMap((measure) => measure.events);
  const notes = events.filter((event) => event.kind === 'note').length;
  console.log(file);
  console.log(`  título: ${score.title}`);
  console.log(`  texto: ${score.subtitle}`);
  console.log(`  autor: ${score.author}`);
  console.log(
    `  partes: ${score.partCount}  pautas: ${score.staffCount}  sistemas: ${score.systems.length}`,
  );
  const first = score.measures[0];
  console.log(
    `  clave: ${CLEF_NAMES[first.clef]}  armadura: ${first.fifths}  fórmula: ${first.beats}/${first.beatType}`,
  );
  console.log(
    `  compassos: ${score.measures.length}  notas: ${notes}  pausas: ${events.length - notes}`,
  );
  for (const warning of score.warnings) console.log(`  aviso: ${warning}`);

  if (flag === '--check') {
    const problems = compare(score, readReference(referencePath));
    for (const problem of problems) console.log(`  DIVERGE ${problem}`);
    console.log(
      problems.length === 0
        ? '  referência: confere'
        : `  referência: ${problems.length} divergência(s)`,
    );
    process.exit(problems.length === 0 ? 0 : 1);
  }
}

// Importado pelos testes, o módulo só exporta `readReferenceXml`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
