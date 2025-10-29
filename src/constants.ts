import type { ChangeType } from './types.js';

export const CHANGE_TYPES: ChangeType[] = [
  'Added',
  'Changed',
  'Deprecated',
  'Fixed',
  'Removed',
  'Security'
] as const;
