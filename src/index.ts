import * as fs from 'fs';
import * as path from 'path';

const yarnlock = require('@yarnpkg/lockfile');
const npmLogicalTree = require('npm-logical-tree');
const yarnLogicalTree = require('yarn-logical-tree');

/**
 * Describes a package and its dependencies.
 */
export interface PackageInfo {
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies: DependencyList;
}

/**
 * Describes a list of packages and resolved versions.
 */
export interface DependencyList {
  [name: string]: string;
}

/**
 * Describes a complete list of packages.
 */
export interface PackageList {
  [name: string]: {
    [version: string]: PackageInfo;
  };
}

/**
 * Contains one entry for each package/version that has a list of resolved
 * dependencies.
 */
export interface SimplePackageList {
  [name: string]: {
    [dependency: string]: string;
  };
}

/**
 * Try to load the package info from NPM if a package-lock.json exists, or
 * yarn if a yarn.lock exists.
 * @param rootDir where to find the package.json and lock files.
 */
export function getPackageList(rootDir: string): PackageList | undefined {
  return getPackageListFromNPM(rootDir) || getPackageListFromYarn(rootDir);
}

/**
 * Load the package info from NPM.
 * @param rootDir where to find the package.json and package-lock.json.
 */
export function getPackageListFromNPM(
  rootDir: string,
): PackageList | undefined {
  const lockpath = path.join(rootDir, 'package-lock.json');
  if (!fs.existsSync(lockpath)) {
    return;
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  const pkgLock = JSON.parse(fs.readFileSync(lockpath, 'utf8'));
  const tree = npmLogicalTree(pkg, pkgLock);
  return flatten(tree);
}

/**
 * Load the package info from Yarn.
 * @param rootDir where to find the package.json and yarn.lock.
 */
export function getPackageListFromYarn(
  rootDir: string,
): PackageList | undefined {
  const lockpath = path.join(rootDir, 'yarn.lock');
  if (!fs.existsSync(lockpath)) {
    return;
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  const pkgLock = yarnlock.parse(fs.readFileSync(lockpath, 'utf8')).object;
  const tree = yarnLogicalTree(pkg, pkgLock);
  return flatten(tree);
}

/**
 * Reduce the package list to just resolved packages and their dependencies.
 */
export function simplify(deps: PackageList): SimplePackageList {
  return Object.keys(deps)
    .map(
      (name): [string, DependencyList][] =>
        Object.keys(deps[name]).map(
          (version): [string, DependencyList] => [
            name + '@' + version,
            deps[name][version].dependencies,
          ],
        ),
    )
    .reduce(
      (list, pkgs) => ({
        ...list,
        ...pkgs.reduce((sublist, [k, v]) => ({ ...sublist, [k]: v }), {}),
      }),
      {},
    );
}

/**
 * Flatten logical tree output.
 */
function flatten(node: any, deps?: PackageList): PackageList {
  if (!deps) {
    deps = {};
  }
  // root node doesn't have a name
  const name = node.name || '.';
  const pkg = deps[name] || {};

  if (node.version in pkg) {
    return deps;
  }
  deps[name] = pkg;

  pkg[node.version || '?'] = {
    name: node.name,
    version: node.version,
    resolved: node.resolved,
    integrity: node.integrity,
    dependencies: [...node.dependencies].reduce(
      (a, [k, v]) => ({
        ...a,
        [k]: v.version,
      }),
      {},
    ),
  };
  if (node.dependencies) {
    node.dependencies.forEach((v: any) => flatten(v, deps));
  }
  return deps;
}
