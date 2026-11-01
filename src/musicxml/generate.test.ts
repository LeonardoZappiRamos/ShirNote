import { describe, expect, it } from 'vitest';
import { simpleMelody } from '../music/examples/simple-melody';
import type { Score } from '../music/model';
import {
  firstMeasureAttributes,
  measure,
  note,
  rest,
  scoreOf,
  singlePart,
  trebleClef,
  voice,
} from '../test-utils/scores';
import { generateMusicXml } from './generate';

function parseMusicXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) throw new Error(`MusicXML inválido: ${error.textContent ?? ''}`);
  return doc;
}

function at<T>(items: ArrayLike<T>, index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Elemento ${index} ausente.`);
  return item;
}

describe('generateMusicXml', () => {
  it('gera score-partwise 4.0 com cabeçalho e metadados', () => {
    const xml = generateMusicXml(simpleMelody);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);

    const doc = parseMusicXml(xml);
    expect(doc.documentElement.tagName).toBe('score-partwise');
    expect(doc.documentElement.getAttribute('version')).toBe('4.0');
    expect(doc.querySelector('work-title')?.textContent).toBe(simpleMelody.title);
    expect(doc.querySelector('creator')?.getAttribute('type')).toBe('composer');
    expect(doc.querySelector('score-part')?.getAttribute('id')).toBe('P1');
    expect(doc.querySelector('part-name')?.textContent).toBe('Melodia');
    expect(doc.querySelectorAll('part > measure')).toHaveLength(8);
  });

  it('calcula divisions a partir das durações', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, '16th'), note('D', 4, 'eighth', { dots: 1 })])]),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));

    expect(doc.querySelector('divisions')?.textContent).toBe('4');
    const durations = Array.from(
      doc.querySelectorAll('note > duration'),
      (node) => node.textContent,
    );
    expect(durations).toEqual(['1', '3']);
  });

  it('representa figuras pontuadas com <dot/>', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('E', 4, 'quarter', { dots: 1 }), note('D', 4, 'eighth')])]),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const firstNote = at(doc.querySelectorAll('note'), 0);

    expect(firstNote.querySelector('type')?.textContent).toBe('quarter');
    expect(firstNote.querySelector('duration')?.textContent).toBe('3');
    expect(firstNote.querySelectorAll('dot')).toHaveLength(1);
  });

  it('emite atributos só no primeiro compasso e quando mudam', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'whole')])], firstMeasureAttributes()),
      measure(2, [voice('1', [note('D', 4, 'whole')])]),
      measure(3, [voice('1', [note('E', 4, 'whole')])], {
        key: { fifths: 2, mode: 'major' },
      }),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const measures = doc.querySelectorAll('measure');

    expect(at(measures, 0).querySelector('divisions')).not.toBeNull();
    expect(at(measures, 1).querySelector('attributes')).toBeNull();

    const thirdAttributes = at(measures, 2).querySelector('attributes');
    expect(thirdAttributes?.querySelector('key fifths')?.textContent).toBe('2');
    expect(thirdAttributes?.querySelector('time')).toBeNull();
    expect(thirdAttributes?.querySelector('clef')).toBeNull();
    expect(thirdAttributes?.querySelector('divisions')).toBeNull();
  });

  it('usa <backup> para a segunda voz voltar ao início do compasso', () => {
    const score = scoreOf([
      measure(
        1,
        [
          voice('1', [note('C', 4, 'quarter'), note('D', 4, 'quarter')]),
          voice('2', [note('E', 4, 'half')]),
        ],
        firstMeasureAttributes(),
      ),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));

    expect(doc.querySelectorAll('backup')).toHaveLength(1);
    expect(doc.querySelector('backup > duration')?.textContent).toBe('2');

    const voices = Array.from(doc.querySelectorAll('note > voice'), (node) => node.textContent);
    expect(voices).toEqual(['1', '1', '2']);
  });

  it('marca ligaduras em <tie> e <notations><tied>', () => {
    const score = scoreOf([
      measure(1, [
        voice('1', [note('C', 4, 'half', { tie: 'start' }), note('C', 4, 'half', { tie: 'stop' })]),
      ]),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const notes = doc.querySelectorAll('note');

    expect(at(notes, 0).querySelector('tie')?.getAttribute('type')).toBe('start');
    expect(at(notes, 0).querySelector('notations tied')?.getAttribute('type')).toBe('start');
    expect(at(notes, 1).querySelector('tie')?.getAttribute('type')).toBe('stop');
  });

  it('distingue pausas de notas', () => {
    const score = scoreOf([measure(1, [voice('1', [rest('whole')])])]);
    const doc = parseMusicXml(generateMusicXml(score));
    const noteElement = at(doc.querySelectorAll('note'), 0);

    expect(noteElement.querySelector('rest')).not.toBeNull();
    expect(noteElement.querySelector('pitch')).toBeNull();
    expect(noteElement.querySelector('type')?.textContent).toBe('whole');
  });

  it('escreve alterações e omite alter nulo', () => {
    const score = scoreOf([
      measure(1, [
        voice('1', [note('F', 4, 'half', { alter: 1 }), note('B', 4, 'half', { alter: 0 })]),
      ]),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const notes = doc.querySelectorAll('note');

    expect(at(notes, 0).querySelector('alter')?.textContent).toBe('1');
    expect(at(notes, 1).querySelector('alter')).toBeNull();
  });

  it('só escreve <staff> quando a nota está em pauta inferior', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 4, 'half', { staff: 2 }), note('D', 4, 'half')])]),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const notes = doc.querySelectorAll('note');

    expect(at(notes, 0).querySelector('staff')?.textContent).toBe('2');
    expect(at(notes, 1).querySelector('staff')).toBeNull();
  });

  it('escapa caracteres especiais em título e autor', () => {
    const score: Score = {
      title: 'A & B <teste>',
      composer: 'X "Y"',
      parts: [singlePart([measure(1, [voice('1', [note('C', 4, 'whole')])])])],
    };
    const xml = generateMusicXml(score);
    const doc = parseMusicXml(xml);

    expect(xml).toContain('&amp;');
    expect(doc.querySelector('work-title')?.textContent).toBe('A & B <teste>');
    expect(doc.querySelector('creator')?.textContent).toBe('X "Y"');
  });

  it('respeita divisions forçado', () => {
    const score = scoreOf([measure(1, [voice('1', [note('C', 4, 'quarter')])])]);
    const doc = parseMusicXml(generateMusicXml(score, { divisions: 8 }));

    expect(doc.querySelector('divisions')?.textContent).toBe('8');
    expect(doc.querySelector('note > duration')?.textContent).toBe('8');
  });

  it('gera múltiplas partes na ordem do modelo', () => {
    const score: Score = {
      parts: [
        singlePart([measure(1, [voice('1', [note('C', 4, 'whole')])])], {
          id: 'P1',
          name: 'Mão direita',
        }),
        singlePart([measure(1, [voice('1', [note('C', 3, 'whole')])])], {
          id: 'P2',
          name: 'Mão esquerda',
        }),
      ],
    };
    const doc = parseMusicXml(generateMusicXml(score));

    const partIds = Array.from(doc.querySelectorAll('part'), (node) => node.getAttribute('id'));
    expect(partIds).toEqual(['P1', 'P2']);
    expect(doc.querySelectorAll('score-part')).toHaveLength(2);
  });

  it('escreve a clave com número da pauta', () => {
    const score = scoreOf([
      measure(1, [voice('1', [note('C', 3, 'whole')])], {
        clefs: [{ sign: 'F', line: 4 }, trebleClef],
      }),
    ]);
    const doc = parseMusicXml(generateMusicXml(score));
    const clefs = doc.querySelectorAll('clef');

    expect(at(clefs, 0).getAttribute('number')).toBe('1');
    expect(at(clefs, 0).querySelector('sign')?.textContent).toBe('F');
    expect(at(clefs, 1).getAttribute('number')).toBe('2');
  });

  it('recusa partitura sem partes', () => {
    expect(() => generateMusicXml({ parts: [] })).toThrow(/ao menos uma parte/i);
  });

  it('recusa divisions inválido', () => {
    const score = scoreOf([measure(1, [voice('1', [note('C', 4, 'whole')])])]);
    expect(() => generateMusicXml(score, { divisions: 0 })).toThrow(/divisions/i);
  });
});
