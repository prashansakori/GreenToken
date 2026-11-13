const DATABASE_NAME = 'greentoken-evidence';
const STORE_NAME = 'files';
const DATABASE_VERSION = 1;

function openEvidenceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open evidence storage.'));
    request.onblocked = () => reject(new Error('Evidence storage upgrade is blocked by another browser tab.'));
  });
}

export async function storeEvidenceFile(sha256: string, file: File): Promise<void> {
  const database = await openEvidenceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(file, sha256);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not store evidence file.'));
      transaction.onabort = () => reject(transaction.error || new Error('Evidence storage transaction was aborted.'));
    });
  } finally {
    database.close();
  }
}

async function getEvidenceFile(sha256: string): Promise<Blob> {
  const database = await openEvidenceDatabase();
  try {
    const file = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(sha256);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(request.error || new Error('Could not read evidence file.'));
    });
    if (!file) {
      throw new Error('Evidence file is not available in this browser storage.');
    }
    return file;
  } finally {
    database.close();
  }
}

async function assertEvidenceDigest(file: Blob, sha256: string): Promise<void> {
  if (!/^[0-9a-f]{64}$/i.test(sha256)) {
    throw new Error('Evidence digest must be a SHA-256 hash.');
  }

  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const actualHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (actualHash !== sha256.toLowerCase()) {
    throw new Error('Evidence bytes do not match the recorded SHA-256 digest.');
  }
}

export async function verifyStoredEvidenceFile(sha256: string): Promise<void> {
  const file = await getEvidenceFile(sha256);
  await assertEvidenceDigest(file, sha256);
}

export async function downloadEvidenceFile(sha256: string, fileName: string): Promise<void> {
  const file = await getEvidenceFile(sha256);
  await assertEvidenceDigest(file, sha256);

  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
