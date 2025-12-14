import { $, execaSync } from 'execa';
import type { TestProject } from 'vitest/node';

export function setup(project: TestProject) {
  // await $`pnpm run build`;
  execaSync('pnpm', ['run', 'build']);

  project.onTestsRerun(async () => {
    await $`pnpm run build`;
  });
}
