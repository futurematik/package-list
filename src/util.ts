import { PackageInfo, PackageList } from './common';

export interface SimpleMap<V> {
  [key: string]: V;
}

export interface SimpleMapEntry<V> {
  key: string;
  value: V;
}

export function entriesToObjReducer<V>(
  obj: SimpleMap<V>,
  current: SimpleMapEntry<V>,
): SimpleMap<V> {
  return {
    ...(<any>obj),
    [current.key]: current.value,
  };
}

export function entriesToObj<V>(entries: SimpleMapEntry<V>[]): SimpleMap<V> {
  return entries.reduce(entriesToObjReducer, {} as SimpleMap<V>);
}

export function entries<V>(obj: SimpleMap<V>): SimpleMapEntry<V>[] {
  return Object.keys(obj).map(key => ({ key, value: obj[key] }));
}

export function packagesToPackageList(packages: PackageInfo[]): PackageList {
  return packages
    .map(x => ({ key: `${x.name}@${x.version}`, value: x }))
    .reduce(entriesToObjReducer, {});
}
