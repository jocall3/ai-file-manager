
import type { FileNode, OrganizationSuggestion } from '../types';
import { addFile, clearAllFiles, deleteFileNode, deleteDescendants, updatePath } from './database';
import loggingService from './loggingService';

async function verifyPermission(fileHandle: FileSystemHandle, readWrite = false): Promise<boolean> {
  const options: { mode?: 'read' | 'readwrite' } = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  
  if ((await (fileHandle as any).queryPermission(options)) === 'granted') {
    return true;
  }
  if ((await (fileHandle as any).requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

export async function openDirectoryAndIngest(): Promise<FileSystemDirectoryHandle | null> {
  if (!(window as any).showDirectoryPicker) {
    throw new Error('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
  }
  try {
    const directoryHandle = await (window as any).showDirectoryPicker();
    if (directoryHandle) {
      await ingestDirectory(directoryHandle);
    }
    return directoryHandle;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      loggingService.log('FileSystemService', 'User aborted directory picker.');
      return null;
    }
    loggingService.error('FileSystemService', 'Error opening directory picker:', e);
    throw e;
  }
}

async function calculateHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function ingestDirectory(directoryHandle: FileSystemDirectoryHandle, parentPath: string | null = null): Promise<void> {
    const allowed = await verifyPermission(directoryHandle);
    if (!allowed) throw new Error('Permission denied to read directory.');

    if (parentPath === null) {
      await clearAllFiles(); // Clear previous data when opening a new root
      loggingService.log('FileSystemService', 'Cleared all previous file data from DB.');
    }

    const currentDirPath = parentPath ? `${parentPath}/${directoryHandle.name}` : directoryHandle.name;

    // Add directory entry to the database
    await addFile({
        id: directoryHandle.name,
        name: directoryHandle.name,
        isDirectory: true,
        path: currentDirPath, // Full path is the key
        handle: directoryHandle,
        parentId: parentPath,
        size: 0,
        modified: 0, // Note: Directories don't have a reliable modified date
    });
    
    for await (const handle of directoryHandle.values()) {
        const childPath = `${currentDirPath}/${handle.name}`;
        if (handle.kind === 'directory') {
            await ingestDirectory(handle as FileSystemDirectoryHandle, currentDirPath);
        } else {
            try {
                const file = await (handle as FileSystemFileHandle).getFile();
                const cid = await calculateHash(file);

                await addFile({
                    id: handle.name,
                    name: handle.name,
                    isDirectory: false,
                    path: childPath,
                    handle: handle,
                    parentId: currentDirPath,
                    size: file.size,
                    modified: file.lastModified,
                    cid: cid,
                });
            } catch (e) {
                loggingService.warn('FileSystemService', `Could not process file ${handle.name}:`, e);
            }
        }
    }
}

export async function createDirectory(parentHandle: FileSystemDirectoryHandle, name: string, parentId: string): Promise<void> {
    const allowed = await verifyPermission(parentHandle, true);
    if (!allowed) {
        throw new Error('Permission denied to create directory.');
    }
    const newHandle = await parentHandle.getDirectoryHandle(name, { create: true });
    
    const newPath = `${parentId}/${name}`;

    await addFile({
        id: name,
        name: name,
        isDirectory: true,
        path: newPath,
        handle: newHandle,
        parentId: parentId,
        size: 0,
        modified: Date.now(),
    });
}

export async function createFile(parentHandle: FileSystemDirectoryHandle, name: string): Promise<void> {
    const allowed = await verifyPermission(parentHandle, true);
    if (!allowed) throw new Error('Permission denied to create file.');
    await parentHandle.getFileHandle(name, { create: true });
}

export async function renameItem(parentHandle: FileSystemDirectoryHandle, parentPath: string, oldName: string, newName: string): Promise<void> {
    const allowed = await verifyPermission(parentHandle, true);
    if (!allowed) throw new Error('Permission denied to rename.');

    // The 'move' method on a directory handle renames a child entry.
    // FIX: Cast parentHandle to 'any' to use the 'move' method, which may not be in default TS types.
    await (parentHandle as any).move(oldName, newName);

    // Update database transactionally
    const oldPath = `${parentPath}/${oldName}`;
    const newPath = `${parentPath}/${newName}`;
    await updatePath(oldPath, newPath);
}


export async function deleteFiles(directoryHandle: FileSystemDirectoryHandle, filesToDelete: FileNode[]): Promise<void> {
    const allowed = await verifyPermission(directoryHandle, true);
    if (!allowed) {
        throw new Error('Permission denied to delete files.');
    }
    for (const file of filesToDelete) {
        // First, remove from database
        if (file.isDirectory) {
            // If it's a directory, remove all its descendants from the DB
            await deleteDescendants(file.path);
        }
        await deleteFileNode(file.path);

        // Then, remove from the actual file system
        await directoryHandle.removeEntry(file.name, { recursive: file.isDirectory });
    }
}

export async function moveItems(sourceParentHandle: FileSystemDirectoryHandle, sourceParentPath: string, itemNames: string[], destHandle: FileSystemDirectoryHandle, destPath: string): Promise<void> {
    const allowedSource = await verifyPermission(sourceParentHandle, true);
    const allowedDest = await verifyPermission(destHandle, true);
    if (!allowedSource || !allowedDest) throw new Error('Permission denied for move operation.');
    
    for (const itemName of itemNames) {
        const oldPath = `${sourceParentPath}/${itemName}`;
        const newPath = `${destPath}/${itemName}`;
        
        // 1. Use the native move method on the source directory handle.
        // FIX: Cast sourceParentHandle to 'any' to use the 'move' method, which may not be in default TS types.
        await (sourceParentHandle as any).move(itemName, destHandle);

        // 2. Update database transactionally
        await updatePath(oldPath, newPath);
    }
}

export async function applyOrganization(directoryHandle: FileSystemDirectoryHandle, suggestions: OrganizationSuggestion[], currentDirectoryPath: string): Promise<void> {
    const allowed = await verifyPermission(directoryHandle, true);
    if (!allowed) throw new Error('Permission denied to organize files.');

    for (const suggestion of suggestions) {
        const { folderName, fileNames } = suggestion;
        if (!fileNames || fileNames.length === 0) continue;

        try {
            const folderHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });
            const newFolderPath = `${currentDirectoryPath}/${folderName}`;
            
            // Create folder entry in DB
            await addFile({
                id: folderName,
                name: folderName,
                isDirectory: true,
                path: newFolderPath,
                handle: folderHandle,
                parentId: currentDirectoryPath,
                size: 0,
                modified: Date.now(),
            });

            // Move the files into the new folder using the new, efficient moveItems function
            await moveItems(directoryHandle, currentDirectoryPath, fileNames, folderHandle, newFolderPath);

        } catch (e) {
            loggingService.error('FileSystemService', `Error processing folder "${folderName}":`, e);
            throw new Error(`Failed to organize files into "${folderName}".`);
        }
    }
}

export async function readFileContent(handle: FileSystemFileHandle): Promise<string> {
    const allowed = await verifyPermission(handle);
    if (!allowed) throw new Error('Permission denied to read file.');
    const file = await handle.getFile();
    return file.text();
}

export async function saveFileContent(handle: FileSystemFileHandle, content: string): Promise<void> {
    const allowed = await verifyPermission(handle, true);
    if (!allowed) throw new Error('Permission denied to write to file.');
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
}