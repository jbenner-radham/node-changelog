import { getBaseWithUnreleasedSection } from '~/operations/init.js';
import type { AnyFlags } from '~/types.js';
import type { Root } from 'mdast';
import type { Result } from 'meow';
import fs from 'node:fs';

export default function create({ changelogPath, cli, getMarkdown }: {
  changelogPath: string;
  cli: Result<AnyFlags>;
  getMarkdown: (tree: Root) => string;
}): void {
  const tree = getBaseWithUnreleasedSection();
  const markdown = getMarkdown(tree);

  if (cli.flags.write) {
    fs.writeFileSync(changelogPath, markdown);
  } else {
    console.log(markdown);
  }
}
