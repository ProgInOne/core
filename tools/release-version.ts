// Prints the shared version of the publishable packages (they move together: Changesets
// `fixed`), or nothing when there are none yet. Fails if the versions disagree.
// Usage: node tools/release-version.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const packagesDir = resolve(import.meta.dirname, '../packages');
const versions = new Set(
  (existsSync(packagesDir) ? readdirSync(packagesDir) : [])
    .map((dir) => join(packagesDir, dir, 'package.json'))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, 'utf8')) as { version: string; private?: boolean })
    .filter((pkg) => pkg.private !== true)
    .map((pkg) => pkg.version),
);

if (versions.size > 1) {
  console.error(`Packages disagree on the version: ${[...versions].join(', ')}`);
  process.exit(1);
}
const [version] = versions;
if (version !== undefined) console.log(version);
