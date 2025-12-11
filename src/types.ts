import { type Flag } from 'meow';

// These aren't exported from `meow` for whatever reason. So I just copy/pasted them here.
// From: https://tinyurl.com/7apyy7bk
export type StringFlag = Flag<'string', string> | Flag<'string', string[], true>;
export type BooleanFlag = Flag<'boolean', boolean> | Flag<'boolean', boolean[], true>;
export type NumberFlag = Flag<'number', number> | Flag<'number', number[], true>;
export type AnyFlag = StringFlag | BooleanFlag | NumberFlag;
export type AnyFlags = Record<string, AnyFlag>;

export type ChangeType = 'Added' | 'Changed' | 'Deprecated' | 'Fixed' | 'Removed' | 'Security';
