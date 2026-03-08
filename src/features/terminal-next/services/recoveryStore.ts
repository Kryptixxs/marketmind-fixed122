const DB_NAME = 'vantage-terminal-db';
const STORE_NAME = 'recovery';
const KEY = 'latest';

export interface RecoverySnapshot {
  ts: number;
  panelFunctions: string[];
  quadrantStates: Array<{ loadedSecurity: string; activeMnemonic: string; history: string[]; sector: string }>;
  panelSizes: number[];
  zoomedQuadrant: number | null;
  lastCommands: string[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecoverySnapshot(snapshot: RecoverySnapshot) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(snapshot, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadRecoverySnapshot(): Promise<RecoverySnapshot | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
  const db = await openDb();
  const out = await new Promise<RecoverySnapshot | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(KEY);
    req.onsuccess = () => resolve((req.result as RecoverySnapshot | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return out;
}

