const DB_NAME = "job-tracker:resumes";
const STORE = "files";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable."));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = operation(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("IndexedDB request failed."));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("IndexedDB transaction failed."));
      })
  );
}

export async function putResumeFile(path: string, file: Blob) {
  await withStore("readwrite", (store) => store.put(file, path));
}

export async function getResumeFile(path: string) {
  const result = await withStore<Blob | undefined>("readonly", (store) =>
    store.get(path)
  );
  return result ?? null;
}

export async function deleteResumeFile(path: string) {
  await withStore("readwrite", (store) => store.delete(path));
}

export async function listResumeFilePaths() {
  const keys = await withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
  return keys.map((key) => String(key));
}
