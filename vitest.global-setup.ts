import { $ } from 'execa';
import type { TestProject } from 'vitest/node';

export async function setup(project: TestProject) {
  console.debug(process.env.PATH);

  await $`pnpm run build`;

  project.onTestsRerun(async () => {
    await $`pnpm run build`;
  });
}
