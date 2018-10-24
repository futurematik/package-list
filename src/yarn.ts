import * as path from 'path';
import * as fs from 'fs';

const yarnlock = require('@yarnpkg/lockfile');

import { PackageList, PackageInfo, DependencyList } from './common';

interface Lockfile {
  [name: string]: LockfileEntry;
}

interface LockfileEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: DependencyList;
}

export function getPackageListFromYarn(
  rootDir?: string,
): PackageList | undefined {
  rootDir = path.resolve(rootDir || '.');
  const pkgPath = path.join(rootDir, 'package.json');
  const lockPath = path.join(rootDir, 'yarn.lock');

  if (!fs.existsSync(pkgPath) || !fs.existsSync(lockPath)) {
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const lock: Lockfile = yarnlock.parse(fs.readFileSync(lockPath, 'utf8'))
    .object;

  const allDeps: DependencyList = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };

  return [
    ...rewriteLock(lock),
    {
      name: '.',
      version: '.',
      requires: allDeps,
      dependencies: mapDependencies(allDeps, lock),
    },
  ].reduce(
    (a, x) => ({
      ...a,
      [x.name]: {
        ...(a[x.name] || {}),
        [x.version]: x,
      },
    }),
    {} as PackageList,
  );
}

function rewriteLock(lockfile: Lockfile): PackageInfo[] {
  return Object.keys(lockfile).map(ref => {
    const node = lockfile[ref];
    const { name } = splitPackageRef(ref);
    const { dependencies, ...rest } = node;

    const ret: PackageInfo = {
      name,
      ...rest,
    };
    if (dependencies) {
      ret.requires = dependencies;
      ret.dependencies = mapDependencies(dependencies, lockfile);
    }
    return ret;
  });
}

function mapDependencies(
  dependencies: DependencyList,
  lockfile: Lockfile,
): DependencyList {
  return Object.keys(dependencies)
    .map(
      (dep): [string, string] => [
        dep,
        lockfile[`${dep}@${dependencies[dep]}`].version,
      ],
    )
    .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
}

function splitPackageRef(ref: string): { name: string; version: string } {
  const i = ref.lastIndexOf('@');
  if (i < 0) {
    throw new Error('poorly formed package reference');
  }
  return {
    name: ref.substr(0, i),
    version: ref.substr(i + 1),
  };
}
