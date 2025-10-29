import lib from '../src/index.js';
import { describe, expect, it } from 'vitest';

describe.skip('lib', () => {
  it('is a function', () => {
    expect(lib).toBeTypeOf('function');
  });
});
