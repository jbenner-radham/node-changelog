import type { Definition, Node } from 'mdast';

export function isDefinition(node?: Node): node is Definition {
  return node?.type === 'definition';
}
