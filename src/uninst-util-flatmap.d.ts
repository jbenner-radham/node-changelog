import type { Node, Nodes } from 'mdast';

declare module 'unist-util-flatmap' {
  export default function flatMap(
    tree: Nodes,
    callback: (node: Node, index: number, parent: Node | null) => Node
  ): Nodes;
}
