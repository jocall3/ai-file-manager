
import { openDB, IDBPDatabase } from 'idb';
import type { FileNode, StorableFileNode } from '../types';

const DB_NAME = 'GeminiFileManagerDB';
const DB_VERSION = 1;
const FILE_STORE_NAME = 'files';

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        const store = db.createObjectStore(FILE_STORE_NAME, {
          keyPath: 'path', // Use full path as the unique key
        });
        store.createIndex('parentId', 'parentId', { unique: false });
        store.createIndex('cid', 'cid', { unique: false });
      }
    },
  });
  return dbPromise;
};

export async function addFile(fileNode: FileNode) {
  const db = await initDB();
  // We need to store a serializable version of the FileNode, so we omit the handle
  const { handle, content, ...storableFileNode } = fileNode;
  await db.put(FILE_STORE_NAME, storableFileNode);
}


export async function getFilesForDirectory(parentId: string | null): Promise<StorableFileNode[]> {
  const db = await initDB();
  const tx = db.transaction(FILE_STORE_NAME, 'readonly');
  const index = tx.store.index('parentId');
  const files = await index.getAll(parentId);
  await tx.done;
  return files;
}

export async function clearAllFiles() {
    const db = await initDB();
    await db.clear(FILE_STORE_NAME);
}

export async function deleteFileNode(path: string) {
  const db = await initDB();
  await db.delete(FILE_STORE_NAME, path);
}

export async function getDescendants(path: string): Promise<StorableFileNode[]> {
    const db = await initDB();
    const allFiles = await db.getAll(FILE_STORE_NAME);
    // Find all files that are children of the given path
    return allFiles.filter(f => f.path.startsWith(`${path}/`));
}

export async function deleteDescendants(path: string): Promise<void> {
    const db = await initDB();
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FILE_STORE_NAME);
    const descendants = await getDescendants(path);

    await Promise.all([
        ...descendants.map(d => store.delete(d.path)),
        store.delete(path), // Also delete the directory itself
    ]);
    
    await tx.done;
}

export async function updatePath(oldPath: string, newPath: string) {
    const db = await initDB();
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FILE_STORE_NAME);

    const originalNode: StorableFileNode | undefined = await store.get(oldPath);
    if (!originalNode) {
        console.error(`Node not found in DB for path: ${oldPath}`);
        await tx.done;
        return;
    }

    const descendants = originalNode.isDirectory ? await getDescendants(oldPath) : [];
    
    // Prepare all nodes that need to be deleted
    const pathsToDelete = [oldPath, ...descendants.map(d => d.path)];
    
    // Prepare all nodes that need to be added
    const newParentPath = newPath.substring(0, newPath.lastIndexOf('/'));
    
    const updatedOriginalNode: StorableFileNode = {
        ...originalNode,
        path: newPath,
        name: newPath.substring(newPath.lastIndexOf('/') + 1),
        parentId: newParentPath,
    };
    
    const updatedDescendants = descendants.map(d => ({
        ...d,
        path: d.path.replace(oldPath, newPath),
        parentId: d.parentId?.replace(oldPath, newPath),
    }));

    const nodesToAdd = [updatedOriginalNode, ...updatedDescendants];

    // Execute all operations within the same transaction
    await Promise.all(pathsToDelete.map(p => store.delete(p)));
    await Promise.all(nodesToAdd.map(n => store.put(n)));
    
    await tx.done;
}