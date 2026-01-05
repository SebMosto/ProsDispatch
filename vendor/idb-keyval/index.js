const defaultDBName = 'keyval-store';
const defaultStoreName = 'keyval';

const openDatabase = (dbName, storeName) => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
};

class Store {
  constructor(dbName = defaultDBName, storeName = defaultStoreName) {
    this._dbp = openDatabase(dbName, storeName);
    this.storeName = storeName;
  }

  _withStore(type, callback) {
    return this._dbp.then(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(this.storeName, type);
          transaction.oncomplete = () => resolve();
          transaction.onabort = transaction.onerror = () => {
            reject(transaction.error || new Error('IndexedDB transaction failed'));
          };

          callback(transaction.objectStore(this.storeName));
        }),
    );
  }
}

const defaultStore = new Store();

const get = (key, store = defaultStore) =>
  store._dbp.then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(store.storeName, 'readonly');
        const objectStore = transaction.objectStore(store.storeName);
        const request = objectStore.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB get failed'));
      }),
  );

const set = (key, value, store = defaultStore) =>
  store._withStore('readwrite', (objectStore) => {
    objectStore.put(value, key);
  });

const del = (key, store = defaultStore) =>
  store._withStore('readwrite', (objectStore) => {
    objectStore.delete(key);
  });

const clear = (store = defaultStore) =>
  store._withStore('readwrite', (objectStore) => {
    objectStore.clear();
  });

const keys = (store = defaultStore) =>
  store._dbp.then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(store.storeName, 'readonly');
        const objectStore = transaction.objectStore(store.storeName);
        const request = objectStore.openKeyCursor();
        const allKeys = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(allKeys);
            return;
          }

          allKeys.push(cursor.key);
          cursor.continue();
        };

        request.onerror = () => reject(request.error || new Error('IndexedDB keys failed'));
      }),
  );

const update = (key, updater, store = defaultStore) =>
  get(key, store).then((value) => set(key, updater(value), store));

const createStore = (dbName = defaultDBName, storeName = defaultStoreName) => new Store(dbName, storeName);

export { Store, clear, createStore, del, get, keys, set, update };
