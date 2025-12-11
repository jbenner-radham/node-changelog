import { withRelease } from '~/operations/release.js';
import type { AnyFlags, ChangeType } from '~/types.js';
import { getReleaseVersionCandidates } from '~/utilities.js';
import type { Root } from 'mdast';
import type { Result } from 'meow';
import fs from 'node:fs';
import type { PackageJson } from 'type-fest';

/**
 * This function contains the logic for the `major`, `minor`, and `patch` commands.
 */
export default function release({
  args,
  changeTypes,
  changelogPath,
  cli,
  getMarkdown,
  pkg,
  tree
}: {
  args: string[];
  changeTypes: ChangeType[];
  changelogPath: string;
  cli: Result<AnyFlags>;
  getMarkdown: (tree: Root) => string;
  pkg: PackageJson;
  tree: Root;
}): void {
  const candidates = getReleaseVersionCandidates(pkg);
  const releaseType = args.find(argument => ['major', 'minor', 'patch'].includes(argument))!;
  const version = candidates[releaseType as 'major' | 'minor' | 'patch'];
  const newTree = withRelease(tree, { changeTypes, pkg, version });
  const markdown = getMarkdown(newTree);

  if (cli.flags.write) {
    fs.writeFileSync(changelogPath, markdown);
  } else {
    console.log(markdown);
  }
}
