import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ScoreViewer } from './ScoreViewer';

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
  it('reaproveita uma instância do OSMD entre arquivos e desliga o resize ao sair', async () => {
    const root = createRoot(document.createElement('div'));
    const onRendered = vi.fn();
    const view = (musicXml: string) => (
      <ScoreViewer musicXml={musicXml} zoom={1} onError={vi.fn()} onRendered={onRendered} />
    );

    await act(async () => root.render(view('<a/>')));
    await act(async () => root.render(view('<b/>')));

    // Uma instância antiga redesenharia a partitura anterior ao redimensionar a janela (tarefa 4.4).
    expect(instances).toHaveLength(1);
    expect(instances[0]?.load.mock.calls.map(([xml]) => xml)).toEqual(['<a/>', '<b/>']);
    expect(onRendered).toHaveBeenCalledTimes(2);

    act(() => root.unmount());
    expect(instances[0]?.AutoResizeEnabled).toBe(false);
  });
});
