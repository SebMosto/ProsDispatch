export type IDBKey = IDBValidKey | IDBKeyRange;
export type Updater<T> = (oldValue: T | undefined) => T;

export class Store {
  constructor(dbName?: string, storeName?: string);
  _dbp: Promise<IDBDatabase>;
  storeName: string;
}

export function createStore(dbName?: string, storeName?: string): Store;
export function get<T>(key: IDBKey, store?: Store): Promise<T | undefined>;
export function set<T>(key: IDBKey, value: T, store?: Store): Promise<void>;
export function del(key: IDBKey, store?: Store): Promise<void>;
export function clear(store?: Store): Promise<void>;
export function keys(store?: Store): Promise<IDBKey[]>;
export function update<T>(key: IDBKey, updater: Updater<T>, store?: Store): Promise<void>;
