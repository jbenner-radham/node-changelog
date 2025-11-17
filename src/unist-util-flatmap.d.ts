/* eslint-disable unicorn/prevent-abbreviations */

declare module 'unist-util-flatmap' {
  import type { Node, Nodes } from 'unist';

  export default function flatMap(
    tree: Nodes,
    callback: (node: Node, index: number, parent: Node | null) => Nodes
  ): Nodes;
}
