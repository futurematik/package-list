# @fmtk/package-list

Reads a package lock file to get information about the packages. Works with
NPM or Yarn.

## Typescript ✔️

Typescript defs are included.

## API

### Function `getPackageList`

This will read the `package-lock.json` or `yarn.lock` to determine info about
the packages.

#### Definition

```typescript
function getPackageList(rootDir?: string): PackageList | undefined;
function getPackageListFromNPM(rootDir?: string): PackageList | undefined;
function getPackageListFromYarn(rootDir?: string): PackageList | undefined;
```

#### Example

```javascript
const packageList = require('super-package-list');

// get info for the package in the current working dir
const packages = packageList.getPackageList();

console.log(JSON.stringify(packages, null, 2));
```

This will output a structure like the following:

```json
{
  "strip-ansi@3.0.1": {
    "name": "strip-ansi",
    "version": "3.0.1",
    "resolved": "http://registry.npmjs.org/strip-ansi/-/strip-ansi-3.0.1.tgz#6a385fb8853d952d5ff05d0e8aaf94278dc63dcf",
    "requires": {
      "ansi-regex": "^2.0.0"
    },
    "dependencies": {
      "ansi-regex": "2.1.1"
    }
  }
}
```

### Function `simplify`

This will return just the dependency info for a package.

#### Definition

```typescript
function simplify(deps: PackageList): SimplePackageList;
```

#### Example

```javascript
const packages = packageList.getPackageList();
const simple = packageList.simplify(packages);
console.log(JSON.stringify(simple, null, 2));
```

This will output a structure like the following:

```json
{
  "super-package-list@1.0.0": {
    "@types/node": "10.12.0",
    "tslint": "5.11.0",
    "typescript": "3.1.3",
    "@yarnpkg/lockfile": "1.1.0",
    "npm-logical-tree": "1.2.1",
    "yarn-logical-tree": "1.0.2"
  },
  "@types/node@10.12.0": {},
  "tslint@5.11.0": {
    "babel-code-frame": "6.26.0",
    "builtin-modules": "1.1.1",
    "chalk": "2.4.1",
    "commander": "2.19.0",
    "diff": "3.5.0",
    "glob": "7.1.3",
    "js-yaml": "3.12.0",
    "minimatch": "3.0.4",
    "resolve": "1.8.1",
    "semver": "5.6.0",
    "tslib": "1.9.3",
    "tsutils": "2.29.0"
  }
}
```
