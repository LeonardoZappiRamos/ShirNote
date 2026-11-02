import { divisionsFor, durationInDivisions } from '../music/duration';
import type {
  Clef,
  Measure,
  MeasureAttributes,
  MusicEvent,
  NoteValue,
  Part,
  Score,
} from '../music/model';
import { serializeXml, type XmlElement } from './xml';

export interface GenerateMusicXmlOptions {
  /** Força um valor de `divisions`; por padrão usa o MMC exato das durações. */
  readonly divisions?: number;
}

const XML_HEADER =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">';

const TYPE_BY_VALUE: Readonly<Record<NoteValue, string>> = {
  breve: 'breve',
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  '16th': '16th',
  '32nd': '32nd',
  '64th': '64th',
};

/** Atributos já emitidos na parte, para só repetir o que mudou. */
interface AttributeState {
  key?: string;
  time?: string;
  clefs?: string;
}

/**
 * Converte o modelo neutro em MusicXML `score-partwise` 4.0.
 *
 * O gerador é tolerante: dados incompletos (sem clave, sem fórmula) geram um
 * documento mais pobre, não uma exceção — exceto partitura sem partes.
 */
export function generateMusicXml(score: Score, options: GenerateMusicXmlOptions = {}): string {
  if (score.parts.length === 0) {
    throw new Error('A partitura precisa ter ao menos uma parte para gerar MusicXML.');
  }

  const divisions = options.divisions ?? divisionsFor(score);
  if (!Number.isInteger(divisions) || divisions < 1) {
    throw new Error(`divisions deve ser um inteiro positivo (recebido: ${divisions}).`);
  }

  const children: XmlElement[] = [];

  if (score.title) {
    children.push({ tag: 'work', children: [{ tag: 'work-title', text: score.title }] });
  }

  if (score.composer) {
    children.push({
      tag: 'identification',
      children: [{ tag: 'creator', attributes: { type: 'composer' }, text: score.composer }],
    });
  }

  children.push(partList(score.parts));
  for (const part of score.parts) {
    children.push(partXml(part, divisions));
  }

  return serializeXml(
    { tag: 'score-partwise', attributes: { version: '4.0' }, children },
    XML_HEADER,
  );
}

function partList(parts: readonly Part[]): XmlElement {
  return {
    tag: 'part-list',
    children: parts.map((part) => ({
      tag: 'score-part',
      attributes: { id: part.id },
      children: [{ tag: 'part-name', text: part.name }],
    })),
  };
}

function partXml(part: Part, divisions: number): XmlElement {
  const state: AttributeState = {};
  let isFirstMeasure = true;

  const measures = part.measures.map((measure) => {
    const element = measureXml(measure, divisions, state, isFirstMeasure, part.staves);
    isFirstMeasure = false;
    return element;
  });

  return { tag: 'part', attributes: { id: part.id }, children: measures };
}

function measureXml(
  measure: Measure,
  divisions: number,
  state: AttributeState,
  isFirstMeasure: boolean,
  staves: number | undefined,
): XmlElement {
  const children: XmlElement[] = [];

  const attributes = attributesXml(measure.attributes, divisions, state, isFirstMeasure, staves);
  if (attributes) children.push(attributes);

  let previousVoiceDuration = 0;

  measure.voices.forEach((voice, index) => {
    if (index > 0 && previousVoiceDuration > 0) {
      children.push({
        tag: 'backup',
        children: [{ tag: 'duration', text: String(previousVoiceDuration) }],
      });
    }

    for (const event of voice.events) {
      children.push(eventXml(event, divisions, voice.id));
    }

    previousVoiceDuration = voice.events.reduce(
      (total, event) =>
        event.type === 'note' && event.chord
          ? total
          : total + durationInDivisions(event.duration, divisions),
      0,
    );
  });

  return { tag: 'measure', attributes: { number: String(measure.number) }, children };
}

function attributesXml(
  attributes: MeasureAttributes | undefined,
  divisions: number,
  state: AttributeState,
  isFirstMeasure: boolean,
  staves: number | undefined,
): XmlElement | null {
  const children: XmlElement[] = [];

  if (isFirstMeasure) {
    children.push({ tag: 'divisions', text: String(divisions) });
  }

  const key = attributes?.key;
  const keySignature = key ? `${key.fifths}:${key.mode ?? 'major'}` : undefined;
  if (key && keySignature !== state.key) {
    const keyChildren: XmlElement[] = [{ tag: 'fifths', text: String(key.fifths) }];
    if (key.mode) keyChildren.push({ tag: 'mode', text: key.mode });
    children.push({ tag: 'key', children: keyChildren });
    state.key = keySignature;
  }

  const time = attributes?.time;
  const timeSignature = time ? `${time.beats}/${time.beatType}` : undefined;
  if (time && timeSignature !== state.time) {
    children.push({
      tag: 'time',
      children: [
        { tag: 'beats', text: String(time.beats) },
        { tag: 'beat-type', text: String(time.beatType) },
      ],
    });
    state.time = timeSignature;
  }

  if (isFirstMeasure && staves !== undefined && staves > 1) {
    children.push({ tag: 'staves', text: String(staves) });
  }

  const clefs = attributes?.clefs;
  const clefSignature = clefs ? JSON.stringify(clefs) : undefined;
  if (clefs && clefs.length > 0 && clefSignature !== state.clefs) {
    clefs.forEach((clef, index) => children.push(clefXml(clef, index + 1)));
    state.clefs = clefSignature;
  }

  return children.length > 0 ? { tag: 'attributes', children } : null;
}

function clefXml(clef: Clef, staffNumber: number): XmlElement {
  const children: XmlElement[] = [
    { tag: 'sign', text: clef.sign },
    { tag: 'line', text: String(clef.line) },
  ];

  if (clef.octaveChange !== undefined) {
    children.push({ tag: 'clef-octave-change', text: String(clef.octaveChange) });
  }

  return { tag: 'clef', attributes: { number: String(staffNumber) }, children };
}

function eventXml(event: MusicEvent, divisions: number, voiceId: string): XmlElement {
  const children: XmlElement[] = [];
  // `continue` não existe em `<tie>`: a nota termina uma ligadura e começa outra.
  const ties =
    event.type === 'note' && event.tie
      ? event.tie === 'continue'
        ? ['stop', 'start']
        : [event.tie]
      : [];

  if (event.type === 'note' && event.chord) children.push({ tag: 'chord' });

  if (event.type === 'note') {
    const pitchChildren: XmlElement[] = [{ tag: 'step', text: event.pitch.step }];
    const alter = event.pitch.alter ?? 0;
    if (alter !== 0) pitchChildren.push({ tag: 'alter', text: String(alter) });
    pitchChildren.push({ tag: 'octave', text: String(event.pitch.octave) });
    children.push({ tag: 'pitch', children: pitchChildren });
  } else {
    children.push({ tag: 'rest' });
  }

  children.push({ tag: 'duration', text: String(durationInDivisions(event.duration, divisions)) });

  for (const type of ties) children.push({ tag: 'tie', attributes: { type } });

  children.push({ tag: 'voice', text: voiceId });
  children.push({ tag: 'type', text: TYPE_BY_VALUE[event.duration.value] });

  for (let dot = 0; dot < (event.duration.dots ?? 0); dot += 1) {
    children.push({ tag: 'dot' });
  }

  const { tuplet } = event.duration;
  if (tuplet) {
    children.push({
      tag: 'time-modification',
      children: [
        { tag: 'actual-notes', text: String(tuplet.actual) },
        { tag: 'normal-notes', text: String(tuplet.normal) },
      ],
    });
  }

  if (event.staff !== undefined && event.staff > 1) {
    children.push({ tag: 'staff', text: String(event.staff) });
  }

  if (ties.length > 0) {
    children.push({
      tag: 'notations',
      children: ties.map((type) => ({ tag: 'tied', attributes: { type } })),
    });
  }

  return { tag: 'note', children };
}
