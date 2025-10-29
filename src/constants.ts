import type { ChangeType } from './types.js';

export const CHANGE_TYPES: ChangeType[] = [
  'Added',
  'Changed',
  'Deprecated',
  'Fixed',
  'Removed',
  'Security'
] as const;

export const UNRELEASED_IDENTIFIER = 'Unreleased' as const;
