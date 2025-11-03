// Based upon: https://tinyurl.com/unist-utils-core-select
// SPDX-License-Identifier: MIT

declare module 'unist-util-select' {
  import type { Node } from 'unist';
  import unistUtilSelect from 'unist-util-select';

  export default unistUtilSelect;

  export function select<T extends Node>(selector: string, tree: Node): T | undefined;

  export function selectAll<T extends Node>(selector: string, tree: Node): T[];
}
