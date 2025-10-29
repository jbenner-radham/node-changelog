import type { Definition, Heading, Node, Text } from 'mdast';

export function isDefinition(node?: Node): node is Definition {
  return node?.type === 'definition';
}

export function isHeading(node?: Node): node is Heading {
  return node?.type === 'heading';
}

export function isText(node?: Node): node is Text {
  return node?.type === 'text';
}
