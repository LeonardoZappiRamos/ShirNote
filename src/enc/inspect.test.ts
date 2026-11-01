import { describe, expect, it } from 'vitest';
import { inspectBinary } from './inspect';

describe('inspectBinary', () => {
  it('gera hexadecimal e ASCII dos primeiros bytes', () => {
    const bytes = new Uint8Array([0x45, 0x4e, 0x43, 0x00, 0x41]);
    const snapshot = inspectBinary(bytes, 4);

    expect(snapshot.byteLength).toBe(5);
    expect(snapshot.previewByteLength).toBe(4);
    expect(snapshot.hex).toBe('45 4E 43 00');
    expect(snapshot.ascii).toBe('ENC.');
  });

  it('aceita ArrayBuffer', () => {
    const buffer = new Uint8Array([0x41, 0x42]).buffer as ArrayBuffer;
    expect(inspectBinary(buffer).ascii).toBe('AB');
  });

  it('lida com arquivo vazio', () => {
    expect(inspectBinary(new Uint8Array(0))).toEqual({
      byteLength: 0,
      previewByteLength: 0,
      hex: '',
      ascii: '',
    });
  });

  it('rejeita maxBytes inválido', () => {
    expect(() => inspectBinary(new Uint8Array([0x41]), -1)).toThrow(/maxBytes/i);
  });
});
