import type { Heading, Node, Text } from 'mdast';
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
  return stripGitPrefixAndSuffixFromUrl(typeof repository === 'string'
    ? repository
    : repository.url
  );
}

export function isHeading(node?: Node): node is Heading {
  return node?.type === 'heading';
}

export function isText(node?: Node): node is Text {
  return node?.type === 'text';
}

export function readPackage({ cwd = process.cwd() }: { cwd?: string } = {}): PackageJson {
  const source = readFileSync(path.join(cwd, 'package.json'), 'utf8');

  return JSON.parse(source);
}

export function stripGitPrefixAndSuffixFromUrl(url: string): string {
  return url.replace(/^git\+/, '').replace(/\.git$/, '');
}
