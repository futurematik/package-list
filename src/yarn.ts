import * as path from 'path';
import * as fs from 'fs';

const yarnlock = require('@yarnpkg/lockfile');

import {
  PackageInfo,
  DependencyList,
  YarnLockfile,
  PackageList,
  getRootDependencies,
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

  const lock = getYarnLock(rootDir);
  if (!lock) {
    return;
  }

  const rootDeps = getRootDependencies(rootDir);

  return packagesToPackageList([
    ...rewriteLock(lock),
    {
      name: '.',
      version: '.',
      requires: rootDeps,
      dependencies: mapDependencies(rootDeps, lock),
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
