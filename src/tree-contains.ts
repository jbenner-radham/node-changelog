import type { Nodes } from 'mdast';
import { select } from 'unist-util-select';

export function hasDefinition(tree: Nodes): boolean {
  return Boolean(select('definition', tree));
}

export function hasDepthTwoHeading(tree: Nodes): boolean {
  return Boolean(select('heading[depth="2"]', tree));
}
