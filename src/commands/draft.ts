import { withUnreleasedSection } from '~/operations/draft.js';
import type { AnyFlags, ChangeType } from '~/types.js';
import type { Root } from 'mdast';
import type { Result } from 'meow';
import fs from 'node:fs';
import type { PackageJson } from 'type-fest';

export default function draft({
  changeTypes,
  changelogPath,
  cli,
  getMarkdown,
  pkg,
  tree
}: {
  changeTypes: ChangeType[];
  changelogPath: string;
  cli: Result<AnyFlags>;
  getMarkdown: (tree: Root) => string;
  pkg: PackageJson;
  tree: Root;
}): void {
  const newTree = withUnreleasedSection(tree, { changeTypes, pkg });
  const markdown = getMarkdown(newTree);

  if (cli.flags.write) {
    fs.writeFileSync(changelogPath, markdown);
  } else {
    console.log(markdown);
  }
}
