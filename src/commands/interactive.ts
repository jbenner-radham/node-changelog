/* eslint-disable  @typescript-eslint/no-unused-vars */

import { select } from '@inquirer/prompts';
import type { AnyFlags, ChangeType } from '~/types.js';
import type { Root } from 'mdast';
import type { Result } from 'meow';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

export default async function interactive({
  changeTypes,
  changelogPath,
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
}): Promise<void> {
  if (!process.stdout.isTTY) {
    throw new Error(
      'This command requires input from prompts. Please run this command in an interactive shell.'
    );
  }

  const action = await select({
    message: 'What would you like to do?',
    choices: [
      {
        name: 'Create a new changelog',
        value: 'create'
      },
      {
        name: 'Add an unreleased section to the changelog',
        value: 'draft'
      },
      {
        name: 'Create a new release or promote an unreleased version',
        value: 'release'
      }
    ]
  });

  console.debug(action);
}
