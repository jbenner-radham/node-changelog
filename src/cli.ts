#!/usr/bin/env node

import { getBaseWithUnreleasedSection } from './commands/init.js';
import { withRelease } from './commands/release.js';
import { hasUnreleasedHeader, withUnreleasedSection } from './commands/unreleased.js';
import { CHANGE_TYPES } from './constants.js';
import type { ChangeType } from './types.js';
import { readPackage } from './util.js';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { parse as parseVersion } from '@radham/semver';
import logSymbols from 'log-symbols';
import type { Root } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import meow from 'meow';
import { getHelpTextAndOptions } from 'meowtastic';
import { gfm } from 'micromark-extension-gfm';
import { existsSync as fileExistsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';
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
const changelogPath = cli.input.length > 1 ? cli.input.at(1)! : 'CHANGELOG.md';
const cwd = cli.input.length > 1 ? path.dirname(cli.input.at(1)!) : process.cwd();
const filepath = path.relative(process.cwd(), changelogPath);
const isTty = Boolean(process.stdout.isTTY);
const packageJsonPath = path.relative(cwd, 'package.json');
const setext = cli.flags.headingStyle === 'setext';

const ensurePackageHasRequiredProperties = (pkg: PackageJson) => {
  if (!pkg.repository) {
    console.error(
      logSymbols.error,
      `No \`repository\` found in \`${packageJsonPath}\`. Cannot continue.`
    );
    process.exit(1);
  }

  if (!pkg.version) {
    console.error(
      logSymbols.error,
      `No \`version\` found in \`${packageJsonPath}\`. Cannot continue.`
    );
    process.exit(1);
  }
};

const getContext = async () => {
  const pkg = readPackage({ cwd });
  const buffer = await fs.readFile(filepath);
  const source = new TextDecoder().decode(buffer);
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });

  removePosition(tree, { force: true });

  return { pkg, tree };
};

const promptThenWriteChangelog = async ({ filepath, tree }: { filepath: string; tree: Root }) => {
  /* eslint-disable @stylistic/indent */
  const writeTo = isTty
    ? await select<string>({
        choices: [filepath, 'stdout'],
        default: filepath,
        message: 'Where do you want to write the changelog?'
      })
    : '';
  /* eslint-enable @stylistic/indent */
  const markdown = toMarkdown(tree, {
    bullet,
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: true
  });

  if (!isTty || writeTo === 'stdout') {
    console.log(markdown);
  } else {
    if (fileExistsSync(writeTo)) {
      const shouldOverwrite = await confirm({
        default: false,
        message: 'A changelog is already present. Overwrite it?'
      });

      if (!shouldOverwrite) {
        return;
      }
    }

    await fs.writeFile(writeTo, markdown);
  }
};

const getReleaseVersionCandidates = (pkg: PackageJson) => {
  const version = parseVersion(pkg.version!);

  return {
    major: `${version.major + 1}.0.0`,
    minor: `${version.major}.${version.minor + 1}.0`,
    patch: `${version.major}.${version.minor}.${version.patch + 1}`
  };
};

if (!args.length) {
  cli.showHelp();
}

if (args.includes('INIT')) {
  const tree = getBaseWithUnreleasedSection();

  await promptThenWriteChangelog({ filepath, tree });
} else if (args.includes('RELEASE')) {
  if (!isTty) {
    console.error(
      logSymbols.error,
      'Cannot release without a TTY. Please run this command in an interactive shell.'
    );
    process.exit(1);
  }

  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);

  const candidates = getReleaseVersionCandidates(pkg);
  const version = await select({
    message: 'What version are you releasing?',
    choices: [
      {
        description: 'Patch',
        value: candidates.patch
      },
      {
        description: 'Minor',
        value: candidates.minor
      },
      {
        description: 'Major',
        value: candidates.major
      }
    ]
  });
  const changeTypes = hasUnreleasedHeader(tree)
    ? []
    : await checkbox<ChangeType>({ message: 'Include which change types?', choices: CHANGE_TYPES });
  const newTree = withRelease(tree, { changeTypes, pkg, version });

  // console.dir(newTree, { depth: undefined });
  await promptThenWriteChangelog({ filepath, tree: newTree });
} else if (args.includes('UNRELEASED')) {
  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);

  const changeTypes = hasUnreleasedHeader(tree)
    ? []
    : await checkbox<ChangeType>({ message: 'Include which change types?', choices: CHANGE_TYPES });
  const newTree = withUnreleasedSection(tree, { changeTypes, pkg });

  await promptThenWriteChangelog({ filepath, tree: newTree });
}
