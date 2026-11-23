import { describe, expect, it } from 'vitest';

import {
  normalizeBlankText,
  normalizeOutputLines,
  toHalfWidth,
  unifySmartQuotes,
  unquoteLiteral,
} from './normalize.ts';
import { createRng, deriveSeed, seedFromString, splitmix64, xoshiro128ss } from './prng.ts';

describe('normalization', () => {
  it('converts full-width characters and smart quotes', () => {
    expect(toHalfWidth('ｒｅｔｕｒｎ　１')).toBe('return 1');
    expect(unifySmartQuotes('“hi” ‘a’')).toBe('"hi" \'a\'');
    expect(normalizeBlankText('  Ｒeturn   a ', false)).toBe('return a');
  });

  it('unquotes only a single complete literal', () => {
    expect(unquoteLiteral('"abc"')).toBe('abc');
    expect(unquoteLiteral("'a\\'b'")).toBe("a\\'b");
    expect(unquoteLiteral('"a" + "b"')).toBeNull();
    expect(unquoteLiteral('"')).toBeNull();
  });

  it('normalizes output lines (CRLF, trailing spaces, trailing blank lines)', () => {
    expect(normalizeOutputLines('a  \r\nb\r\n\n\n')).toEqual(['a', 'b']);
    expect(normalizeOutputLines('')).toEqual([]);
  });
});

describe('PRNG', () => {
  it('matches the SplitMix64 reference vector for seed 0', () => {
    let state = 0n;
    const outputs: bigint[] = [];
    for (let i = 0; i < 3; i++) {
      const step = splitmix64(state);
      state = step.state;
      outputs.push(step.value);
    }
    expect(outputs).toEqual([0xe220a8397b1dcdafn, 0x6e789e6aa1b965f4n, 0x06c45d188009454fn]);
  });

  it('matches xoshiro128** reference outputs for state [1, 2, 3, 4]', () => {
    const next = xoshiro128ss([1, 2, 3, 4]);
    expect([next(), next(), next()]).toEqual([11520, 0, 5927040]);
  });

  it('is deterministic per seed and differs across seeds', () => {
    const a = createRng(0xa91f2cn);
    const b = createRng(0xa91f2cn);
    const c = createRng(0xa91f2dn);
    const draw = (rng: ReturnType<typeof createRng>) =>
      Array.from({ length: 8 }, () => rng.nextUint32());
    const first = draw(a);
    expect(draw(b)).toEqual(first);
    expect(draw(c)).not.toEqual(first);
  });

  it('draws integers inside the range and covers it', () => {
    const rng = createRng(42n);
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i++) {
      const v = rng.int(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen.size).toBe(7);
    expect(() => rng.int(5, 1)).toThrow(RangeError);
  });

  it('shuffles deterministically without losing items', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = createRng(seedFromString('attempt-1')).shuffle(items);
    expect(createRng(seedFromString('attempt-1')).shuffle(items)).toEqual(shuffled);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('hashes strings (UTF-8) and derives seed chains stably', () => {
    expect(seedFromString('가')).toBe(seedFromString('가'));
    expect(seedFromString('a')).not.toBe(seedFromString('b'));
    expect(deriveSeed(1n)).toBe(splitmix64(1n).value);
  });
});
