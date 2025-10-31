import hostedGitInfo from 'hosted-git-info';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

export function getDate(): string {
  return new Date().toISOString()
    .split('T')
    .at(0)!;
}

export function getNormalizedRepository(
  repository: string | { type: string; url: string; directory?: string }
) {
  const info = hostedGitInfo.fromUrl(
    typeof repository === 'string'
      ? repository
      : repository.url,
    { noCommittish: true, noGitPlus: true }
  );

  return info?.https()?.replace(/\.git$/, '') ?? '';
}

export function readPackage({ cwd = process.cwd() }: { cwd?: string } = {}): PackageJson {
  // Using a `TextDecoder` here strips out the BOM if present.
  const buffer = readFileSync(path.join(cwd, 'package.json'));
  const source = new TextDecoder().decode(buffer);

  return JSON.parse(source);
}
