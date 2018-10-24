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
 * Reduce the package list to just resolved packages and their dependencies.
 */
export function simplify(deps: PackageList): SimplePackageList {
  return Object.keys(deps)
    .map(
      (name): [string, DependencyList][] =>
        Object.keys(deps[name]).map(
          (version): [string, DependencyList] => [
            name + '@' + version,
            deps[name][version].dependencies || {},
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
