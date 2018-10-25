import * as path from 'path';
import * as fs from 'fs';

const yarnlock = require('@yarnpkg/lockfile');

import {
  PackageInfo,
  DependencyList,
  YarnLockfile,
  PackageList,
} from './common';
import { packagesToPackageList, entries, entriesToObjReducer } from './util';

/**
 * Parse the yarn.lock file. Returns undefined if not found.
 */
export function getYarnLock(rootDir?: string): YarnLockfile | undefined {
  rootDir = path.resolve(rootDir || '.');
  const lockPath = path.join(rootDir, 'yarn.lock');

  if (!fs.existsSync(lockPath)) {
    return;
  }

  return yarnlock.parse(fs.readFileSync(lockPath, 'utf8')).object;
}

/**
 * Get a package list in common format from the yarn.lock file.
 */
export function getPackageListFromYarn(
  rootDir?: string,
): PackageList | undefined {
  rootDir = path.resolve(rootDir || '.');
  const pkgPath = path.join(rootDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const lock = getYarnLock(rootDir);
  if (!lock) {
    return;
  }

  const allDeps: DependencyList = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };

  return packagesToPackageList([
    ...rewriteLock(lock),
    {
      name: '.',
      version: '.',
      requires: allDeps,
      dependencies: mapDependencies(allDeps, lock),
    },
  ]);
}

/**
 * Rewrite the given yarn lock file to the common structure.
 */
function rewriteLock(lockfile: YarnLockfile): PackageInfo[] {
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

/**
 * Map the list of given dependencies to their resolved versions.
 */
function mapDependencies(
  dependencies: DependencyList,
  lockfile: YarnLockfile,
): DependencyList {
  return entries(dependencies)
    .map(({ key, value }) => ({
      key,
      value: lockfile[`${key}@${value}`].version,
    }))
    .reduce(entriesToObjReducer, {});
}

/**
 * Split a package@ver tuple into package and version.
 */
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
