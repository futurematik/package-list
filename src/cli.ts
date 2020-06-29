import path from 'path';
import { getPackageList } from '.';
import { simplify } from './common';

const args = process.argv.slice(2);
const options = args.filter((x) => x.startsWith('--')).map((x) => x.slice(2));
const positional = args.filter((x) => !x.startsWith('--'));

const pkg = path.resolve(positional[0] || process.cwd());
const packages = getPackageList(pkg);

if (!packages) {
  console.error(`unable to find package.lock.json or yarn.lock in ${pkg}`);
  process.exit(1);
}

if (options.includes('json')) {
  if (options.includes('simplify')) {
    console.log(JSON.stringify(simplify(packages), null, 2));
  } else {
    console.log(JSON.stringify(packages, null, 2));
  }
} else {
  let packageList = Object.keys(simplify(packages)).filter((x) => x !== '.@.');

  if (!options.includes('--with-version')) {
    packageList = [
      ...new Set(
        packageList.map((x) => x.slice(0, x.lastIndexOf('@'))),
      ).values(),
    ];
  }

  console.log(packageList.sort().join('\n'));
}
