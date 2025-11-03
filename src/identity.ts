import isPlainObject from 'is-plain-obj';
import type { Definition, Heading, Text } from 'mdast';

export function isDefinition(value: unknown): value is Definition {
  return isPlainObject(value) && value.type === 'definition';
}

export function isHeading(value: unknown): value is Heading {
  return isPlainObject(value) && value.type === 'heading';
}

export function isText(value: unknown): value is Text {
  return isPlainObject(value) && value.type === 'text';
}
