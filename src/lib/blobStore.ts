/**
 * Tiny IndexedDB wrapper for storing uploaded file blobs.
 *
 * localStorage can only hold ~5MB of strings and cannot store binary files,
 * so actual document blobs (PDF / JPG / PNG) are kept here, keyed by id.
 * The lightweight metadata (name, size, category) lives in the Pinia store
 * and is persisted to localStorage.
 */

const DB_NAME = 'sweldupro-files'
const STORE = 'blobs'
const VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        const database = req.result
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  const database = await db()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadBlob(id: string): Promise<Blob | undefined> {
  const database = await db()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteBlob(id: string): Promise<void> {
  const database = await db()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
