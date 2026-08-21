const DB_NAME = "smart-health.medical-documents";
const STORE_NAME = "files";
const DB_VERSION = 1;

export type StoredFile = {
  id: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available in this environment."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open file store."));
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("File store error."));
  });
}

export const fileStore = {
  async put(file: StoredFile): Promise<void> {
    await withStore("readwrite", (store) => store.put(file));
  },

  async get(fileId: string): Promise<StoredFile | null> {
    try {
      const result = await withStore(
        "readonly",
        (store) => store.get(fileId) as IDBRequest<StoredFile | undefined>
      );
      return result ?? null;
    } catch {
      return null;
    }
  },

  async remove(fileId: string): Promise<void> {
    await withStore("readwrite", (store) => store.delete(fileId) as IDBRequest<undefined>);
  },

  async purge(fileIds: string[]): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    fileIds.forEach((id) => store.delete(id));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("File purge error."));
    });
  },
};