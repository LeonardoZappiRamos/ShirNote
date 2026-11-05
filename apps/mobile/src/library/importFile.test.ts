import { describe, expect, it } from 'vitest';

import { classifyImport, convertMusicXml, ImportError } from './importFile';

describe('classificação do arquivo importado', () => {
  it('reconhece .enc sem diferenciar maiúsculas', () => {
    expect(classifyImport('hino.enc')).toBe('enc');
    expect(classifyImport('HINO.ENC')).toBe('enc');
  });

  it('reconhece MusicXML pelas duas extensões', () => {
    expect(classifyImport('partitura.musicxml')).toBe('musicxml');
    expect(classifyImport('partitura.xml')).toBe('musicxml');
  });

  it('recusa formatos fora do escopo', () => {
    expect(classifyImport('partitura.pdf')).toBeNull();
    expect(classifyImport('partitura')).toBeNull();
    expect(classifyImport('partitura.mscz')).toBeNull();
  });
});

describe('importação de MusicXML', () => {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"></score-partwise>';

  it('guarda o XML e usa o nome do arquivo como título', () => {
    const imported = convertMusicXml(xml, 'C:\\acervo\\Cordeiro.xml');

    expect(imported.kind).toBe('musicxml');
    expect(imported.title).toBe('Cordeiro');
    expect(imported.musicXml).toBe(xml);
    expect(imported.scoreJson).toBeNull();
    expect(imported.warnings).toEqual([]);
  });

  it('remove BOM antes de guardar', () => {
    const imported = convertMusicXml(`\uFEFF${xml}`, 'hino.musicxml');
    expect(imported.musicXml.startsWith('<?xml')).toBe(true);
  });

  it('recusa XML que não é partitura', () => {
    expect(() => convertMusicXml('<html></html>', 'pagina.xml')).toThrow(ImportError);
  });

  it('recusa arquivo vazio', () => {
    expect(() => convertMusicXml('   ', 'vazio.xml')).toThrow(ImportError);
  });
});
