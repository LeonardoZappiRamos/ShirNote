import { describe, expect, it } from 'vitest';

import { serializeViewerMessage } from './protocol';

describe('ponte do visualizador', () => {
  it('serializa MusicXML com aspas e quebras de linha', () => {
    const serialized = serializeViewerMessage({
      type: 'render',
      musicXml: '<score-partwise>\n  "x"\n</score-partwise>',
      label: 'Hino',
      zoom: 1,
    });

    expect(JSON.parse(serialized)).toEqual({
      type: 'render',
      musicXml: '<score-partwise>\n  "x"\n</score-partwise>',
      label: 'Hino',
      zoom: 1,
    });
  });

  it('escapa U+2028 e U+2029 para não quebrar o script injetado', () => {
    const serialized = serializeViewerMessage({
      type: 'render',
      musicXml: 'a\u2028b\u2029c',
      label: 'x',
      zoom: 1,
    });

    expect(serialized).toContain('\\u2028');
    expect(serialized).toContain('\\u2029');
    expect(serialized).not.toContain('\u2028');
    expect(serialized).not.toContain('\u2029');
    expect(JSON.parse(serialized).musicXml).toBe('a\u2028b\u2029c');
  });

  it('mantém conteúdo com </script> como dado, não como HTML', () => {
    const serialized = serializeViewerMessage({
      type: 'render',
      musicXml: '</script><script>alert(1)</script>',
      label: 'x',
      zoom: 1,
    });

    // A injeção é feita via evaluateJavascript, não via HTML; o JSON continua válido.
    expect(JSON.parse(serialized).musicXml).toBe('</script><script>alert(1)</script>');
  });

  it('leva a posição de leitura junto com o redesenho', () => {
    const serialized = serializeViewerMessage({
      type: 'render',
      musicXml: '<score-partwise />',
      label: 'Hino',
      zoom: 1.5,
      scrollRatio: 0.42,
    });

    expect(JSON.parse(serialized)).toMatchObject({ zoom: 1.5, scrollRatio: 0.42 });
  });
});
