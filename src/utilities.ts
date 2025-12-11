import { parse as parseVersion } from '@radham/semver';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

export function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}

export function getDate(): string {
  return new Date().toISOString()
    .split('T')
    .at(0)!;

  // const date = new Date();
  // const year = date.getFullYear();
  // const month = String(date.getMonth() + 1).padStart(2, '0');
  // const day = String(date.getDate()).padStart(2, '0');
  //
  // return `${year}-${month}-${day}`;
}

export function getReleaseVersionCandidates(pkg: PackageJson): {
  major: string;
  minor: string;
  patch: string;
} {
  const version = parseVersion(pkg.version!);

  return {
    major: `${version.major + 1}.0.0`,
    minor: `${version.major}.${version.minor + 1}.0`,
    patch: `${version.major}.${version.minor}.${version.patch + 1}`
  };
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
