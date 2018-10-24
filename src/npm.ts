import * as path from 'path';
import * as fs from 'fs';
import { PackageList, PackageInfo, DependencyList } from './common';

interface LockfileEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  requires?: DependencyList;
  dependencies?: {
    [name: string]: LockfileEntry;
  };
}

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

  return rewriteLock('.', lock).reduce(
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
