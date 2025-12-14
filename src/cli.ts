#!/usr/bin/env node

import type { ChangeType } from './types.js';
import { capitalize, readPackage } from './utilities.js';
import create from '~/commands/create.js';
import draft from '~/commands/draft.js';
import release from '~/commands/release.js';
import logSymbols from 'log-symbols';
import type { Root } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import meow from 'meow';
import { getHelpTextAndOptions } from 'meowtastic';
import { gfm } from 'micromark-extension-gfm';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
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
      draft: {
        arguments: [{ name: 'changelog' }],
        description: 'Add an unreleased section to the changelog.'
      },

      // TODO: Create this command.
      // lint: {
      //   arguments: [{ name: 'changelog' }],
      //   description: 'Lint the changelog.'
      // },
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
} else if (args.some(argument => ['major', 'minor', 'patch'].includes(argument))) {
  const { pkg, tree } = await getContext();

  ensurePackageHasRequiredProperties(pkg);
  release({ args, changeTypes, changelogPath, cli, getMarkdown, pkg, tree });

  process.exit(0);
}
