import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

export function getDate(): string {
  return new Date().toISOString()
    .split('T')
    .at(0)!;
}

export function getRepositoryTaggedReleaseUrl(repository: string, version: string): string {
  // TODO: Look into if this URL syntax works for BitBucket and GitLab.
  return `${repository}/releases/tag/v${version}`;
}

export function getRepositoryVersionCompareUrl(
  repository: string,
  from: string,
  to: string
): string {
  // TODO: Look into if this URL syntax works for BitBucket and GitLab.
  return `${repository}/compare/v${from}...${to === 'HEAD' ? '' : 'v'}${to}`;
}

export function isVersionString(value: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(value);
}

export function readPackage({ cwd = process.cwd() }: { cwd?: string } = {}): PackageJson {
  // Using a `TextDecoder` here strips out the BOM if present.
  const buffer = readFileSync(path.join(cwd, 'package.json'));
  const source = new TextDecoder().decode(buffer);

  return JSON.parse(source);
}
