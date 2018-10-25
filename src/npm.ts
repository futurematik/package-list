import * as path from 'path';
import * as fs from 'fs';
import { PackageInfo, DependencyList, PackageList } from './common';
import { packagesToPackageList } from './util';

interface LockfileEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  requires?: DependencyList;
  dependencies?: {
    [name: string]: LockfileEntry;
  };
}

/**
 * Get a package list in the common structure from the package-lock.json file,
 * or undefined if not present.
 */
export function getPackageListFromNPM(
  rootDir?: string,
): PackageList | undefined {
  rootDir = path.resolve(rootDir || '.');
  const lockPath = path.join(rootDir, 'package-lock.json');

  if (!fs.existsSync(lockPath)) {
    return;
  }

  const lock: LockfileEntry = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  // make it easy to find the root package
  lock.version = '.';

  return packagesToPackageList(rewriteLock('.', lock));
}

/**
 * Rewrite the given NPM lock file to the common structure.
 */
function rewriteLock(
  name: string,
  node: LockfileEntry,
  root?: LockfileEntry,
  path?: LockfileEntry[],
): PackageInfo[] {
  if (!root) {
    root = node;
  }
  const fullPath = (path || []).concat([node]);
  const { dependencies, ...rest } = node;
  const children = dependencies
    ? Object.keys(dependencies)
        .map(x => rewriteLock(x, dependencies[x], root, fullPath))
        .reduce((a, x) => [...a, ...x], [])
    : [];
  return [
    {
      name,
      ...rest,
      dependencies: rewriteDeps(rest.requires, fullPath),
    },
    ...children,
  ];
}

/**
 * Change the version ranges to resolved versions.
 */
function rewriteDeps(
  deps: DependencyList | undefined,
  nodes: LockfileEntry[],
): DependencyList | undefined {
  if (!deps) {
    return;
  }
  return Object.keys(deps)
    .map(
      (x): [string, string | undefined] => [x, findDependencyVersion(x, nodes)],
    )
    .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
}

/**
 * Find a resolved package by looking up the tree starting at the current node.
 */
function findDependencyVersion(
  packageName: string,
  nodes: LockfileEntry[],
): string | undefined {
  for (let i = nodes.length - 1; i >= 0; --i) {
    if (!nodes[i].dependencies) {
      continue;
    }
    const pkg = nodes[i].dependencies![packageName];
    if (pkg) {
      return pkg.version;
    }
  }
}
