import { render } from 'cli-testing-library';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it as baseIt } from 'vitest';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const it = baseIt.extend<{
  fixture: string;
  setup: string;
}>({
  fixture: '',
  setup: async ({ fixture }, use) => {
    const fixturesPath = path.join(dirname, 'fixtures');

    if (!fixture.length) {
      throw new Error('A fixture must be specified for setup.');
    }

    const fixturePath = path.join(fixturesPath, fixture);

    if (!fs.statSync(fixturePath).isDirectory()) {
      throw new Error(`The fixture "${fixture}" does not exist in the fixtures directory.`);
    }

    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-cli-'));

    fs.cpSync(fixturePath, cwd, { recursive: true });

    await use(cwd);
  }
});

describe('cli', () => {
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

  describe('a project at v0.1.1 with a populated unreleased section', () => {
    it.scoped({ fixture: 'v0.1.1-with-a-populated-unreleased-section' });

    it('successfully promotes the unreleased section to a minor release', async ({
      setup: cwd
    }) => {
      const { findByText } = await render(changelog, ['minor'], { cwd });

      expect(await findByText(/\[0.2.0] - \d{4}-\d{2}-\d{2}/)).toBeInTheConsole();
    });

    it('successfully promotes the unreleased definition to a minor release', async ({
      setup: cwd
    }) => {
      const { findByText } = await render(changelog, ['minor'], { cwd });

      expect(await findByText(/\[0.2.0]: https:\/\/github.com\/.+/)).toBeInTheConsole();
    });

    it('removes all unreleased references after successfully promoting to a minor release', async ({
      setup: cwd
    }) => {
      const { findByText } = await render(changelog, ['minor'], { cwd });

      expect(async () => await findByText(/\[unreleased]/i)).rejects.toThrow();
    });
  });
});
