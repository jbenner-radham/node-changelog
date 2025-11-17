import library from '../src/index.js';
import { describe, expect, it } from 'vitest';

describe.skip('library', () => {
  it('is a function', () => {
    expect(library).toBeTypeOf('function');
  });
});
