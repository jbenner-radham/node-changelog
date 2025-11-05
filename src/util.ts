import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

export function getDate(): string {
  return new Date().toISOString()
    .split('T')
    .at(0)!;
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
