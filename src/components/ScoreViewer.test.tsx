import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ScoreViewer, type ShownScore } from './ScoreViewer';

const instances: { AutoResizeEnabled: boolean; load: ReturnType<typeof vi.fn> }[] = [];

vi.mock('opensheetmusicdisplay', () => ({
  OpenSheetMusicDisplay: class {
    AutoResizeEnabled = true;
    Sheet = { Instruments: [{}] };
    load = vi.fn(() => Promise.resolve());
    setOptions = vi.fn();
    render = vi.fn();
    constructor() {
      instances.push(this);
    }
  },
}));

// O ambiente de teste do React precisa desta flag para `act` não avisar.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ScoreViewer', () => {
  it('reaproveita uma instância do OSMD, redesenha o mesmo arquivo e limpa no erro', async () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    const onRendered = vi.fn();
    const view = (score: ShownScore) => (
      <ScoreViewer score={score} zoom={1} onError={vi.fn()} onRendered={onRendered} />
    );

    await act(async () => root.render(view({ musicXml: '<a/>', label: 'Partitura: A' })));
    await act(async () => root.render(view({ musicXml: '<b/>', label: 'Partitura: B' })));
    // O mesmo arquivo aberto de novo gera o mesmo MusicXML e precisa avisar que desenhou.
    await act(async () => root.render(view({ musicXml: '<b/>', label: 'Partitura: B' })));

    // Uma instância antiga redesenharia a partitura anterior ao redimensionar a janela (tarefa 4.4).
    expect(instances).toHaveLength(1);
    expect(instances[0]?.load.mock.calls.map(([xml]) => xml)).toEqual(['<a/>', '<b/>', '<b/>']);
    expect(onRendered).toHaveBeenCalledTimes(3);
    expect(host.querySelector('[role=img]')?.getAttribute('aria-label')).toBe('Partitura: B');

    await act(async () => root.render(view({ musicXml: null, label: 'Nenhuma' })));
    expect(host.textContent).toContain('Nenhuma partitura aberta.');
    expect(instances[0]?.AutoResizeEnabled).toBe(false);

    act(() => root.unmount());
  });
});
