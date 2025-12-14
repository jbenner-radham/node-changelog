import { render } from 'cli-testing-library';
import { describe, expect, it } from 'vitest';

describe('cli', () => {
  const description = 'A tool for managing Keep a Changelog (https://keepachangelog.com/) changelogs.';

  it('displays help text when ran with no flags or commands', async () => {
    // const { findByText } = await render('changelog');
    const { findByText } = await render('./dist/esm/cli.js', [], { cwd: process.cwd() });

    expect(await findByText(description)).toBeInTheConsole();
  });

  it.skip('displays help text when passed the help flag', async () => {
    const { findByText } = await render('changelog', ['--help']);

    expect(await findByText(description)).toBeInTheConsole();
  });
});
