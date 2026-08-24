const DATABASE_NAME = 'cossim-api-cache';
const DATABASE_VERSION = 1;
const STORE_NAME = 'get-responses';
const MAX_ENTRIES = 500;

const canUseIndexedDB = () => typeof window !== 'undefined' && 'indexedDB' in window;
const normalizeIndexedDbError = (error, fallbackMessage) => {
  if (error instanceof Error) return error;
  return new Error(error?.message || error?.target?.error?.message || fallbackMessage);
};

const openDatabase = () => new Promise((resolve, reject) => {
  if (!canUseIndexedDB()) {
    resolve(null);
    return;
  }

  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      store.createIndex('updatedAt', 'updatedAt');
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = (event) => reject(normalizeIndexedDbError(
    request.error || event,
    'Unable to open the API cache'
  ));
});

const runTransaction = async (mode, operation) => {
  const database = await openDatabase();
  if (!database) return null;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;

    try {
      result = operation(store);
    } catch (error) {
      database.close();
      reject(normalizeIndexedDbError(error, 'IndexedDB cache operation failed'));
      return;
    }

    transaction.oncomplete = () => {
      database.close();
      // IDBRequest.result is legitimately undefined when a key does not exist.
      // Do not fall back to returning the IDBRequest itself in that case.
      const isIndexedDbRequest = result && typeof result === 'object' && 'result' in result;
      resolve(isIndexedDbRequest ? (result.result ?? null) : (result ?? null));
    };
    transaction.onerror = (event) => {
      database.close();
      reject(normalizeIndexedDbError(transaction.error || event, 'IndexedDB cache transaction failed'));
    };
    transaction.onabort = (event) => {
      database.close();
      reject(normalizeIndexedDbError(transaction.error || event, 'IndexedDB cache transaction was aborted'));
    };
  });
};

export const getCachedApiResponse = async (key) => {
  try {
    const cached = await runTransaction('readonly', (store) => store.get(key));
    const isValidRecord = cached
      && cached.key === key
      && Object.prototype.hasOwnProperty.call(cached, 'data')
      && Number.isFinite(cached.updatedAt);
    return isValidRecord ? cached : null;
  } catch (error) {
    console.warn('IndexedDB cache read failed:', error?.message || error);
    return null;
  }
};

const pruneCache = async () => {
  try {
    const database = await openDatabase();
    if (!database) return;

    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      let entriesToRemove = countRequest.result - MAX_ENTRIES;
      if (entriesToRemove <= 0) return;

      const cursorRequest = store.index('updatedAt').openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor || entriesToRemove <= 0) return;
        cursor.delete();
        entriesToRemove -= 1;
        cursor.continue();
      };
    };
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
    transaction.onabort = () => database.close();
  } catch (error) {
    console.warn('IndexedDB cache pruning failed:', error?.message || error);
  }
};

export const setCachedApiResponse = async (key, response) => {
  try {
    await runTransaction('readwrite', (store) => store.put({
      key,
      data: response.data,
      status: response.status,
      headers: response.headers instanceof Headers
        ? Object.fromEntries(response.headers.entries())
        : response.headers || {},
      updatedAt: Date.now(),
    }));
    void pruneCache();
  } catch (error) {
    // Quota and structured-clone failures should never interrupt API requests.
    console.warn('IndexedDB cache write failed:', error?.message || error);
  }
};

const canonicalizeUrl = (url) => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const parsed = new URL(url, base);
  const sortedParameters = [...parsed.searchParams.entries()]
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || valueA.localeCompare(valueB));
  parsed.search = '';
  sortedParameters.forEach(([key, value]) => parsed.searchParams.append(key, value));
  return `${parsed.origin}${parsed.pathname}${parsed.search}`;
};

const fingerprint = (value = '') => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const createApiCacheKey = (url, token = '') =>
  `GET:${fingerprint(token)}:${canonicalizeUrl(url)}`;

export const restoreCachedResponse = (cached) => ({
  data: cached.data,
  status: cached.status,
  headers: new Headers(cached.headers || {}),
  fromCache: true,
  cachedAt: cached.updatedAt,
});
