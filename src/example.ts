import * as packageList from '.';

// get info for the package in the current working dir
const packages = packageList.getPackageList();

console.log(JSON.stringify(packages, null, 2));
console.log(JSON.stringify(packageList.simplify(packages!), null, 2));
