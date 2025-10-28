import lib from '../src/index.js';
import { describe, expect, it } from 'vitest';

describe('lib', () => {
  it('is a function', () => {
    expect(lib).toBeTypeOf('function');
  });
});
