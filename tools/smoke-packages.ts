// Installs the packed tarballs of every publishable package into a clean consumer project and
// checks what a language repository will see: each `exports` entry resolves, JS entries load in
// Node and TypeScript finds their types, and no test files are shipped.
// Usage: node tools/smoke-packages.ts   (run `pnpm build` first)
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageJson {
  name: string;
  version: string;
  private?: boolean;
  exports?: Record<string, unknown>;
  peerDependencies?: Record<string, string>;
}

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');

function readPackageJson(dir: string): PackageJson {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PackageJson;
}

function run(cmd: string, args: string[], cwd: string): string {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

const publishable = (existsSync(packagesDir) ? readdirSync(packagesDir) : [])
  .map((dir) => join(packagesDir, dir))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .map((dir) => ({ dir, pkg: readPackageJson(dir) }))
  .filter(({ pkg }) => pkg.private !== true);

if (publishable.length === 0) {
  console.log('No publishable packages yet; nothing to check.');
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), 'proginone-smoke-'));
const tarballs = join(work, 'tarballs');
const consumer = join(work, 'consumer');
mkdirSync(tarballs);
mkdirSync(consumer);

const failures: string[] = [];
const dependencies: Record<string, string> = {};

for (const { dir, pkg } of publishable) {
  // pnpm pack applies publishConfig and turns workspace: ranges into real versions.
  const out = run('pnpm', ['pack', '--pack-destination', tarballs, '--json'], dir);
  const { filename } = JSON.parse(out) as { filename: string };
  const shipped = run('tar', ['-tzf', filename], root).split('\n');
  for (const file of shipped) {
    if (/\.test\.[cm]?[jt]sx?$|(^|\/)src\/test\//.test(file)) {
      failures.push(`${pkg.name}: ships test file ${file}`);
    }
  }
  dependencies[pkg.name] = `file:${filename}`;
  for (const [peer, range] of Object.entries(pkg.peerDependencies ?? {})) {
    dependencies[peer] ??= range;
  }
}

writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({ name: 'smoke-consumer', private: true, type: 'module', dependencies }, null, 2),
);
// The consumer resolves @proginone/* only from the tarballs; a missing one fails instead of
// silently reaching a registry.
run(
  'npm',
  ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--loglevel=error'],
  consumer,
);

const typeImports: string[] = [];
for (const { pkg } of publishable) {
  for (const subpath of Object.keys(pkg.exports ?? {})) {
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, '')}`;
    if (specifier.endsWith('.css')) {
      const probe = `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`;
      const url = run('node', ['--input-type=module', '-e', probe], consumer).trim();
      if (!existsSync(fileURLToPath(url)))
        failures.push(`${specifier}: resolves to a missing file`);
      continue;
    }
    const probe = `const m = await import(${JSON.stringify(specifier)}); console.log(Object.keys(m).length);`;
    try {
      const count = Number(run('node', ['--input-type=module', '-e', probe], consumer).trim());
      if (count === 0) failures.push(`${specifier}: loads but exports nothing`);
    } catch {
      failures.push(`${specifier}: fails to load in Node`);
    }
    typeImports.push(`export * as m${typeImports.length} from ${JSON.stringify(specifier)};`);
  }
}

if (typeImports.length > 0) {
  writeFileSync(join(consumer, 'index.ts'), `${typeImports.join('\n')}\n`);
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2024',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
        lib: ['ES2024', 'DOM'],
        types: [],
      },
      files: ['index.ts'],
    }),
  );
  try {
    // tsc reports on stdout, so let it through.
    execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], {
      cwd: consumer,
      stdio: 'inherit',
    });
  } catch {
    failures.push('TypeScript could not resolve the packaged types (see output above)');
  }
}

if (failures.length > 0) {
  console.error(`Package smoke check failed (${work}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Checked ${publishable.length} package(s): ${publishable.map(({ pkg }) => pkg.name).join(', ')}`,
);
