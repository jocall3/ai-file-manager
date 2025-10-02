// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import * as fileSystemService from './fileSystemService';
import { getFilesForDirectory } from './database';
import type { FileNode, PathSegment } from '../types';

interface CommandContext {
    currentHandle: FileSystemDirectoryHandle;
    rootHandle: FileSystemDirectoryHandle;
    path: PathSegment[];
    changeDirectory: (path: PathSegment[]) => Promise<void>;
    openEditor: (fileName: string) => void;
    refresh: () => void;
}

export async function executeCommand(commandString: string, context: CommandContext): Promise<string> {
    const [command, ...args] = commandString.trim().split(/\s+/).filter(Boolean);
    if (!command) return '';

    try {
        switch (command.toLowerCase()) {
            case 'ls':
                return await listDirectory(context.currentHandle, args);
            case 'pwd':
                return `/${context.path.map(p => p.name).join('/')}`;
            case 'cd':
                return await changeDirectory(args[0], context);
            case 'mkdir':
                return await makeDirectory(args[0], context);
            case 'touch':
                return await createFile(args[0], context);
            case 'rm':
                return await removeFile(args, context);
            case 'cat':
                return await catFile(args[0], context);
            case 'vim':
                return await openVim(args[0], context);
            case 'mv':
                 return await moveOrRename(args, context);
            case 'clear':
                return 'clear';
            case 'help':
                return 'Available commands: ls, pwd, cd, mkdir, touch, rm, cat, vim, mv, clear, help';
            default:
                return `command not found: ${command}`;
        }
    } catch (e) {
        return e instanceof Error ? e.message : 'An unknown error occurred.';
    }
}

async function listDirectory(handle: FileSystemDirectoryHandle, args: string[]): Promise<string> {
    let output = [];
    for await (const entry of handle.values()) {
        output.push(entry.name + (entry.kind === 'directory' ? '/' : ''));
    }
    return output.join('\n');
}

async function changeDirectory(targetPath: string, context: CommandContext): Promise<string> {
    if (!targetPath) return 'Usage: cd <directory>';

    let newPath: PathSegment[];

    if (targetPath === '..') {
        if (context.path.length > 1) {
            newPath = context.path.slice(0, -1);
        } else {
            return 'Already at root.';
        }
    } else if (targetPath === '/') {
        newPath = [context.path[0]];
    } else {
        try {
            const targetHandle = await context.currentHandle.getDirectoryHandle(targetPath, { create: false });
            newPath = [...context.path, { name: targetHandle.name, handle: targetHandle }];
        } catch (e) {
            return `cd: no such file or directory: ${targetPath}`;
        }
    }

    await context.changeDirectory(newPath);
    return '';
}

async function makeDirectory(name: string, context: CommandContext): Promise<string> {
    if (!name) return 'Usage: mkdir <directory_name>';
    const parentId = context.path.map(p => p.name).join('/');
    await fileSystemService.createDirectory(context.currentHandle, name, parentId);
    context.refresh();
    return '';
}

async function createFile(name: string, context: CommandContext): Promise<string> {
    if (!name) return 'Usage: touch <file_name>';
    await fileSystemService.createFile(context.currentHandle, name);
    context.refresh();
    return '';
}

async function removeFile(names: string[], context: CommandContext): Promise<string> {
    if (names.length === 0) return 'Usage: rm <file_or_directory_name>';
    
    const parentId = context.path.map(p => p.name).join('/');
    const filesInDir = await getFilesForDirectory(parentId);
    
    const storableFilesToDelete = filesInDir.filter(f => names.includes(f.name));

    if(storableFilesToDelete.length === 0) {
        return `rm: cannot remove '${names[0]}': No such file or directory`;
    }

    try {
        const filesToDeleteWithHandles: FileNode[] = await Promise.all(
            storableFilesToDelete.map(async (storableFile) => {
                const handle = storableFile.isDirectory
                    ? await context.currentHandle.getDirectoryHandle(storableFile.name)
                    : await context.currentHandle.getFileHandle(storableFile.name);
                return { ...storableFile, handle };
            })
        );
        await fileSystemService.deleteFiles(context.currentHandle, filesToDeleteWithHandles);
    } catch (e) {
         return e instanceof Error ? e.message : 'Error removing file(s).';
    }

    context.refresh();
    return '';
}

async function catFile(fileName: string, context: CommandContext): Promise<string> {
    if (!fileName) return 'Usage: cat <filename>';
    try {
        const fileHandle = await context.currentHandle.getFileHandle(fileName, { create: false });
        return await fileSystemService.readFileContent(fileHandle);
    } catch(e) {
        return `cat: ${fileName}: No such file or directory`;
    }
}

async function openVim(fileName: string, context: CommandContext): Promise<string> {
    if (!fileName) return 'Usage: vim <filename>';
    context.openEditor(fileName);
    return `Opening ${fileName} in editor...`;
}

async function moveOrRename(args: string[], context: CommandContext): Promise<string> {
    if (args.length < 2) return 'Usage: mv <source> <destination> or mv <source...> <directory>';
    
    const { currentHandle, refresh } = context;
    const currentPathString = context.path.map(p => p.name).join('/');
    
    const sources = args.slice(0, -1);
    const destName = args[args.length - 1];
    
    let destHandle: FileSystemDirectoryHandle | null = null;
    try {
        destHandle = await currentHandle.getDirectoryHandle(destName, { create: false });
    } catch (e) {
        // Not a directory, or doesn't exist. This is expected for a rename.
    }

    if (destHandle) { // It's a move into a directory
        const destPathString = `${currentPathString}/${destName}`;
        await fileSystemService.moveItems(currentHandle, currentPathString, sources, destHandle, destPathString);
    } else { // It's a rename
        if (sources.length > 1) {
            return `mv: target '${destName}' is not a directory`;
        }
        await fileSystemService.renameItem(currentHandle, currentPathString, sources[0], destName);
    }
    
    refresh();
    return '';
}