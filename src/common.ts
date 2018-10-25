import * as path from 'path';
import * as fs from 'fs';
import { entries, entriesToObjReducer } from './util';

/**
 * Describes a package and its dependencies.
 */
export interface PackageInfo {
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  requires?: DependencyList;
  dependencies?: DependencyList;
}

/**
 * Describes a list of packages and resolved versions.
 */
export interface DependencyList {
  [name: string]: string;
}

/**
 * Describes a list of packages.
 */
export interface PackageList {
  [ref: string]: PackageInfo;
}

/**
 * Contains one entry for each package/version that has a list of resolved
 * dependencies.
 */
export interface SimplePackageList {
  [ref: string]: DependencyList;
}

/**
 * Represents a yarn lock file.
 */
export interface YarnLockfile {
  [name: string]: YarnLockfileEntry;
}

/**
 * Represents an entry in a yarn lock file.
 */
export interface YarnLockfileEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: DependencyList;
}

/**
 * Get the root dependencies from the package.json file.
 */
export function getRootDependencies(rootDir?: string): DependencyList {
  rootDir = path.resolve(rootDir || '.');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };
}

/**
 * Reduce the package list to just resolved packages and their dependencies.
 */
export function simplify(packages: PackageList): SimplePackageList {
  return entries(packages)
    .map(({ key, value }) => ({ key, value: value.dependencies || {} }))
    .reduce(entriesToObjReducer, {});
}
