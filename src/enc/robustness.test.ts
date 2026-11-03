/**
 * Tarefa 4.2 / RNF-02 e RF-03: arquivo ruim nunca pode derrubar a interface.
 *
 * O contrato testado aqui vale para qualquer entrada: `parseEncore` ou devolve uma partitura
 * íntegra (modo tolerante) ou lança `EncoreFormatError` com mensagem legível. `RangeError`,
 * `TypeError` e afins são falha: escapariam do `catch` da UI como "Falha ao ler" sem explicação.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseEncore } from './parser';
import { EncoreFormatError } from './types';

const FIXTURES = [
  'tests/fixtures/samples/justica-flauta2.enc',
  'tests/fixtures/controlled/controle-17-duas-partes.enc',
];

const read = (path: string) => new Uint8Array(readFileSync(path));

/** Executa o contrato e devolve como o arquivo terminou: `erro` ou `aceito`. */
function checkContract(bytes: Uint8Array, label: string): 'erro' | 'aceito' {
  try {
    const { score } = parseEncore(bytes);
    expect(score.parts.length, `${label}: partitura sem partes`).toBeGreaterThan(0);
    for (const part of score.parts) {
      expect(part.measures.length, `${label}: parte sem compassos`).toBeGreaterThan(0);
    }
    return 'aceito';
  } catch (error) {
    expect(error, `${label}: lançou ${String(error)} em vez de EncoreFormatError`).toBeInstanceOf(
      EncoreFormatError,
    );
    const formatError = error as EncoreFormatError;
    expect(formatError.message.length, `${label}: mensagem vazia`).toBeGreaterThan(10);
    expect(formatError.code, `${label}: código do erro`).toBeTruthy();
    return 'erro';
  }
}

/** PRNG determinístico (mulberry32): a mesma falha reproduz sempre. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe('arquivo truncado', () => {
  for (const path of FIXTURES) {
    const full = read(path);
    const name = path.split('/').pop();

    it(`${name}: corte em qualquer ponto vira EncoreFormatError`, () => {
      const offsets = new Set([
        0,
        1,
        3,
        4,
        5,
        8,
        0x2b,
        0x2c,
        0x2e,
        0x32,
        0x33,
        0x34,
        0x40,
        0xc1,
        0xc2,
        0xc3,
        0xc4,
        1000,
        Math.floor(full.length / 2),
        full.length - 60,
        full.length - 1,
      ]);
      for (const offset of offsets) {
        if (offset < 0 || offset >= full.length) continue;
        checkContract(full.subarray(0, offset), `${name} truncado em ${offset} B`);
      }
    });

    it(`${name}: cabeçalho válido com o fim faltando vira EncoreFormatError`, () => {
      // Mantém SCOW e a versão, mas corta a última década de bytes.
      checkContract(full.subarray(0, full.length - 10), `${name} sem o fim`);
    });
  }
});

describe('conteúdo que não é Encore', () => {
  const full = read(FIXTURES[0]!);

  it('buffer vazio e bytes aleatórios', () => {
    checkContract(new Uint8Array(0), 'vazio');
    randomBytes(full);
  });

  it('magia e versão erradas', () => {
    const noMagic = full.slice();
    noMagic.set([0x50, 0x4b, 0x03, 0x04], 0); // um ZIP qualquer
    expect(() => parseEncore(noMagic)).toThrowError(EncoreFormatError);
    expect(() => parseEncore(noMagic)).toThrowError(/não é uma partitura do Encore/);

    const wrongVersion = full.slice();
    wrongVersion[4] = 0xc3;
    expect(() => parseEncore(wrongVersion)).toThrowError(/0xc3/);
  });

  it('arquivo de texto e PDF disfarçados de .enc', () => {
    checkContract(new TextEncoder().encode('isto não é uma partitura'), 'texto');
    checkContract(new TextEncoder().encode('%PDF-1.7\n'), 'pdf');
  });

  it('cabeçalho coerente com pauta zero não quebra o parser', () => {
    // `staffCount = 0` já derrubou com "Invalid array length" numa versão anterior.
    const noStaves = full.slice();
    noStaves[0x32] = 0; // partes
    noStaves[0x33] = 0; // pautas
    checkContract(noStaves, 'sem partes nem pautas');
  });

  it('contagem de partes e de sistemas fora da faixa', () => {
    for (const [offset, value] of [
      [0x32, 0xff],
      [0x33, 0xff],
      [0x2e, 0xffff],
      [0x34, 0xffff],
    ] as const) {
      const patched = full.slice();
      patched[offset] = value & 0xff;
      if (offset === 0x2e || offset === 0x34) patched[offset + 1] = value >> 8;
      checkContract(patched, `cabeçalho com +0x${offset.toString(16)} = 0x${value.toString(16)}`);
    }
  });
});

describe('mutações aleatórias', () => {
  for (const path of FIXTURES) {
    const full = read(path);
    const name = path.split('/').pop();

    it(`${name}: 500 alterações de 1 a 3 bytes não geram erro inesperado`, () => {
      const next = random(0x5eed);
      const outcomes = { erro: 0, aceito: 0 };

      for (let run = 0; run < 500; run += 1) {
        const mutated = full.slice();
        const changes = 1 + Math.floor(next() * 3);
        for (let change = 0; change < changes; change += 1) {
          mutated[Math.floor(next() * mutated.length)] = Math.floor(next() * 256);
        }
        outcomes[checkContract(mutated, `${name} mutação ${run}`)] += 1;
      }

      // As duas saídas são aceitáveis; o que não pode é o teste não exercitar nenhuma delas.
      expect(outcomes.erro + outcomes.aceito).toBe(500);
    });
  }
});

/** Bytes aleatórios de tamanhos variados, com semente fixa. */
function randomBytes(full: Uint8Array): void {
  const next = random(0xc0ffee);
  for (const size of [1, 2, 4, 8, 100, 1024, full.length]) {
    const bytes = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) bytes[index] = Math.floor(next() * 256);
    checkContract(bytes, `${size} B aleatórios`);
  }
}
