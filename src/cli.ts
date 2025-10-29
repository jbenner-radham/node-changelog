import { getBaseWithUnreleasedSection } from './commands/init.js';
import { withRelease } from './commands/release.js';
import { hasUnreleasedHeader, withUnreleasedSection } from './commands/unreleased.js';
import { CHANGE_TYPES } from './constants.js';
import type { ChangeType } from './types.js';
import { readPackage } from './util.js';
import { checkbox } from '@inquirer/prompts';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import meow from 'meow';
import { getHelpTextAndOptions } from 'meowtastic';
import { gfm } from 'micromark-extension-gfm';
import fs from 'node:fs/promises';
import path from 'node:path';

const cli = meow(
  ...getHelpTextAndOptions({
    arguments: [{ name: 'init | unreleased', isRequired: true }],
    flags: {
      headingStyle: {
        choices: ['atx', 'setext'],
        description:
          'Use this style of headings (%CHOICES_OR%). Defaults to %DEFAULT%.',
        default: 'setext',
        shortFlag: 'H',
        type: 'string'
      }
    },
    importMeta: import.meta
  })
);

const args = cli.input.map(value => value.toUpperCase());
const setext = cli.flags.headingStyle === 'setext';

if (!args.length) {
  cli.showHelp();
}

if (args.includes('INIT')) {
  const tree = getBaseWithUnreleasedSection();
  const markdown = toMarkdown(tree, {
    bullet: '-',
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  console.log(markdown);
}

if (args.includes('RELEASE')) {
  const changelogPath = cli.input.length > 1 ? cli.input.at(1)! : 'CHANGELOG.md';
  const cwd = cli.input.length > 1 ? path.dirname(cli.input.at(1)!) : process.cwd();
  const source = await fs.readFile(changelogPath, 'utf8');
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });
  const newTree = withRelease(tree, { pkg: readPackage({ cwd }), version: '0.1.0' });

  // console.dir(newTree, { depth: undefined });
  const markdown = toMarkdown(newTree, {
    bullet: '-',
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  console.log(markdown);
}

if (args.includes('UNRELEASED')) {
  const changelogPath = cli.input.length > 1 ? cli.input.at(1)! : 'CHANGELOG.md';
  const cwd = cli.input.length > 1 ? path.dirname(cli.input.at(1)!) : process.cwd();
  const source = await fs.readFile(changelogPath, 'utf8');
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });

  const changeTypes: ChangeType[] = hasUnreleasedHeader(tree)
    ? []
    : await checkbox({ message: 'Include which change types?', choices: CHANGE_TYPES });

  const pkg = readPackage({ cwd });
  const newTree = withUnreleasedSection(tree, { changeTypes, pkg });
  const markdown = toMarkdown(newTree, {
    bullet: '-',
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  console.log(markdown);
}
