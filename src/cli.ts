#!/usr/bin/env node

import { getBaseWithUnreleasedSection } from './commands/init.js';
import { withRelease } from './commands/release.js';
import { hasUnreleasedHeader, withUnreleasedSection } from './commands/unreleased.js';
import { CHANGE_TYPES } from './constants.js';
import type { ChangeType } from './types.js';
import { readPackage } from './util.js';
import { checkbox, select } from '@inquirer/prompts';
import { parse as parseVersion } from '@radham/semver';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import meow from 'meow';
import { getHelpTextAndOptions } from 'meowtastic';
import { gfm } from 'micromark-extension-gfm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { removePosition } from 'unist-util-remove-position';

const cli = meow(
  ...getHelpTextAndOptions({
    arguments: [
      { name: 'init | release | unreleased', isRequired: true },
      { name: 'changelog' }
    ],
    flags: {
      bulletListMarker: {
        choices: ['*', '+', '-'],
        description:
          'Use this marker for bullet (unordered) lists (%CHOICES_OR%). Defaults to %DEFAULT%.',
        default: '-',
        shortFlag: 'b',
        type: 'string'
      },
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
const bullet = cli.flags.bulletListMarker as '*' | '+' | '-';
const setext = cli.flags.headingStyle === 'setext';

if (!args.length) {
  cli.showHelp();
}

if (args.includes('INIT')) {
  const tree = getBaseWithUnreleasedSection();
  const markdown = toMarkdown(tree, {
    bullet,
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  console.log(markdown);
}

const getCwdAndTree = async () => {
  const changelogPath = cli.input.length > 1 ? cli.input.at(1)! : 'CHANGELOG.md';
  const cwd = cli.input.length > 1 ? path.dirname(cli.input.at(1)!) : process.cwd();
  const source = await fs.readFile(changelogPath, 'utf8');
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });

  removePosition(tree, { force: true });

  return { cwd, filepath: path.relative(process.cwd(), changelogPath), tree };
};

if (args.includes('RELEASE')) {
  const { cwd, filepath, tree } = await getCwdAndTree();
  const pkg = readPackage({ cwd });
  const parsedVersion = parseVersion(pkg.version!);
  const version = await select({
    message: 'What version are you releasing?',
    choices: [
      {
        description: 'Patch',
        value: `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch + 1}`
      },
      {
        description: 'Minor',
        value: `${parsedVersion.major}.${parsedVersion.minor + 1}.0`
      },
      {
        description: 'Major',
        value: `${parsedVersion.major + 1}.0.0`
      }
    ]
  });
  const changeTypes = hasUnreleasedHeader(tree)
    ? []
    : await checkbox<ChangeType>({ message: 'Include which change types?', choices: CHANGE_TYPES });
  const newTree = withRelease(tree, { changeTypes, pkg, version });

  // console.dir(newTree, { depth: undefined });
  const markdown = toMarkdown(newTree, {
    bullet,
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  const writeTo = await select<string>({
    choices: [filepath, 'stdout'],
    default: filepath,
    message: 'Where do you want to write the changelog?'
  });

  if (writeTo === 'stdout') {
    console.log(markdown);
  } else {
    await fs.writeFile(writeTo, markdown, 'utf8');
  }
}

if (args.includes('UNRELEASED')) {
  const { cwd, filepath, tree } = await getCwdAndTree();
  const changeTypes: ChangeType[] = hasUnreleasedHeader(tree)
    ? []
    : await checkbox({ message: 'Include which change types?', choices: CHANGE_TYPES });

  const pkg = readPackage({ cwd });
  const newTree = withUnreleasedSection(tree, { changeTypes, pkg });
  const markdown = toMarkdown(newTree, {
    bullet,
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  const writeTo = await select<string>({
    choices: [filepath, 'stdout'],
    default: filepath,
    message: 'Where do you want to write the changelog?'
  });

  if (writeTo === 'stdout') {
    console.log(markdown);
  } else {
    await fs.writeFile(writeTo, markdown, 'utf8');
  }
}
