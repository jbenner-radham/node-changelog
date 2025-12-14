#!/usr/bin/env node

import { CHANGE_TYPES } from './constants.js';
import type { ChangeType } from './types.js';
import { capitalize, readPackage } from './utilities.js';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { parse as parseVersion } from '@radham/semver';
import create from '~/commands/create.js';
import draft from '~/commands/draft.js';
import interactive from '~/commands/interactive.js';
import release from '~/commands/release.js';
import { hasUnreleasedHeading } from '~/operations/draft.js';
import { withRelease } from '~/operations/release.js';
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
import { styleText } from 'node:util';
import terminalLink from 'terminal-link';
import type { PackageJson } from 'type-fest';
import { removePosition } from 'unist-util-remove-position';

const cli = meow(
  ...getHelpTextAndOptions({
    commands: {
      create: {
        arguments: [{ name: 'changelog' }],
        description: 'Create a new changelog.'
      },

      // TODO: Create this command.
      // lint: {
      //   arguments: [{ name: 'changelog' }],
      //   description: 'Lint the changelog.'
      // },

      // TODO: Change this command to "interactive" or something and make it all encompassing.
      release: {
        arguments: [{ name: 'changelog' }],
        description: 'Create a new release or promote an unreleased version.'
      },
      major: {
        arguments: [{ name: 'changelog' }],
        description: 'Create a new major release or promote an unreleased section to one.'
      },
      minor: {
        arguments: [{ name: 'changelog' }],
        description: 'Create a new minor release or promote an unreleased section to one.'
      },
      patch: {
        arguments: [{ name: 'changelog' }],
        description: 'Create a new patch release or promote an unreleased section to one.'
      },
      draft: {
        arguments: [{ name: 'changelog' }],
        description: 'Add an unreleased section to the changelog.'
      }
    },
    description: `A tool for managing ${
      terminalLink('Keep a Changelog', 'https://keepachangelog.com/', { fallback: (text, url) => `${text} (${url})` })
    } changelogs.`,
    flags: {
      bulletListMarker: {
        choices: ['*', '+', '-'],
        description:
          'Use this marker for bullet lists (%CHOICES_OR%). Defaults to %DEFAULT%.',
        default: '-',
        shortFlag: 'b',
        type: 'string'
      },
      changeType: {
        choices: ['added', 'changed', 'deprecated', 'fixed', 'removed', 'security'],
        description: 'Create a section stub for this change type (%CHOICES_OR%). Can be specified' +
          ' multiple times.',
        default: [],
        isMultiple: true,
        shortFlag: 'c',
        type: 'string'
      },
      headingStyle: {
        choices: ['atx', 'setext'],
        description:
          'Use this style of headings (%CHOICES_OR%). Defaults to %DEFAULT%.',
        default: 'setext',
        shortFlag: 'H',
        type: 'string'
      },
      separateDefinitions: {
        description: 'Separate definitions with blank lines.',
        default: false,
        shortFlag: 's',
        type: 'boolean'
      },
      write: {
        description: 'Write to the changelog file instead of stdout.',
        default: false,
        shortFlag: 'w',
        type: 'boolean'
      }
    },
    importMeta: import.meta
  })
);

const args = cli.input.map(value => value.toLowerCase());
const bullet = cli.flags.bulletListMarker as '*' | '+' | '-';
const changelogPath = cli.input.length > 1 ? cli.input.at(1)! : 'CHANGELOG.md';
const changeTypes = (cli.flags.changeType as string[]).map(capitalize) as ChangeType[];
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
  const markup = new TextDecoder().decode(buffer);
  const originalTree = fromMarkdown(markup, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });
  const tree = structuredClone(originalTree);

  removePosition(tree, { force: true });

  return { pkg, tree };
};

const getMarkdown = (tree: Root): string => toMarkdown(tree, {
  bullet,
  extensions: [gfmToMarkdown()],
  setext,
  tightDefinitions: !cli.flags.separateDefinitions
});

const promptThenWriteChangelog = async ({ filepath, tree }: { filepath: string; tree: Root }) => {
  /* eslint-disable @stylistic/indent */
  const writeTo = isTty
    ? await select<string>({
        choices: [filepath, 'stdout'],
        default: filepath,
        message: 'Where do you want to write the changelog?'
      })
    : 'stdout';
  /* eslint-enable @stylistic/indent */
  const markdown = toMarkdown(tree, {
    bullet,
    extensions: [gfmToMarkdown()],
    setext,
    tightDefinitions: !cli.flags.separateDefinitions
  });

  if (writeTo === 'stdout') {
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

// TODO: Finish migrating to the version of this function in utilities.
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

if (args.includes('create')) {
  create({ changelogPath, cli, getMarkdown });

  process.exit(0);
} else if (args.includes('draft')) {
  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);
  draft({ changeTypes, changelogPath, cli, getMarkdown, pkg, tree });

  process.exit(0);
} else if (args.includes('interactive')) {
  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);

  try {
    await interactive({ changeTypes, changelogPath, cli, getMarkdown, pkg, tree });
  } catch (error) {
    const message = Error.isError(error) ? error.message : String(error);

    console.error(logSymbols.error, message);

    process.exit(1);
  }

  process.exit(0);
} else if (args.some(argument => ['major', 'minor', 'patch'].includes(argument))) {
  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);
  release({ args, changeTypes, changelogPath, cli, getMarkdown, pkg, tree });

  process.exit(0);
} else if (args.includes('release')) {
  if (!isTty) {
    console.error(
      logSymbols.error,
      'This command requires input from prompts. Please run this command in an interactive shell.'
    );
    process.exit(1);
  }

  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);

  const emphasizeVersionChangeType = (
    version: string, changeType: 'major' | 'minor' | 'patch'
  ): string => {
    const { major, minor, patch } = parseVersion(version);

    switch (changeType) {
      case 'major':
        return `${styleText('bold', major.toString())}.0.0`;
      case 'minor':
        return `${major}.${styleText('bold', minor.toString())}.0`;
      case 'patch':
        return `${major}.${minor}.${styleText('bold', patch.toString())}`;
    }
  };

  const candidates = getReleaseVersionCandidates(pkg);
  const version = await select({
    message: `What version are you releasing? (Current: ${pkg.version})`,
    choices: [
      {
        description: 'Major',
        name: emphasizeVersionChangeType(candidates.major, 'major'),
        value: candidates.major
      },
      {
        description: 'Minor',
        name: emphasizeVersionChangeType(candidates.minor, 'minor'),
        value: candidates.minor
      },
      {
        description: 'Patch',
        name: emphasizeVersionChangeType(candidates.patch, 'patch'),
        value: candidates.patch
      }
    ]
  });
  const changeTypes = hasUnreleasedHeading(tree)
    ? []
    : await checkbox<ChangeType>({ message: 'Include which change types?', choices: CHANGE_TYPES });
  const newTree = withRelease(tree, { changeTypes, pkg, version });

  // console.dir(newTree, { depth: undefined });
  await promptThenWriteChangelog({ filepath, tree: newTree });
} // else if (args.includes('draft')) {

// const changeTypes = hasUnreleasedHeading(tree)
//   ? []
//   : await checkbox<ChangeType>({
//      message: 'Include which change types?', choices: CHANGE_TYPES
//     });
// const newTree = withUnreleasedSection(tree, { changeTypes, pkg });
//
// if (isDeepStrictEqual(tree, newTree)) {
//   console.error(logSymbols.error, 'No changes generated. Skipping update.');
//   process.exit(1);
// }
//
// await promptThenWriteChangelog({ filepath, tree: newTree });
// }
