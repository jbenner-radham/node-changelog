import { render } from 'cli-testing-library';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('cli', () => {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const changelog = path.resolve(dirname, '..', 'dist', 'esm', 'cli.js');
  const description = 'A tool for managing Keep a Changelog (https://keepachangelog.com/) changelogs.';

  it('displays help text when ran with no flags or commands', async () => {
    const { findByText } = await render(changelog);

    expect(await findByText(description)).toBeInTheConsole();
  });

  it('displays help text when passed the help flag', async () => {
    const { findByText } = await render(changelog, ['--help']);

    expect(await findByText(description)).toBeInTheConsole();
  });
});
