import { PackageList } from './common';
import { getPackageListFromNPM } from './npm';
import { getPackageListFromYarn } from './yarn';

export * from './common';
export * from './npm';
export * from './yarn';

export function getPackageList(rootDir?: string): PackageList | undefined {
  return getPackageListFromNPM(rootDir) || getPackageListFromYarn(rootDir);
}
