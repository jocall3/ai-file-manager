
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ViewType } from './types';
import type { FileNode, SortOption, OrganizationSuggestion } from './types';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import FileView from './components/FileView';
import Footer from './components/layout/Footer';
import SmartOrganizeModal from './components/modals/SmartOrganizeModal';
import CreateFolderModal from './components/modals/CreateFolderModal';
import RenameModal from './components/modals/RenameModal';
import ContextMenu, { ContextMenuItem } from './components/ui/ContextMenu';
import Icon from './components/ui/Icon';
import * as fileSystemService from './services/fileSystemService';
import { getFilesForDirectory } from './services/database';
import Terminal from './components/terminal/Terminal';
import EditorModal from './components/modals/EditorModal';

type PathSegment = { name: string; handle: FileSystemDirectoryHandle };

const App: React.FC = () => {
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [currentHandle, setCurrentHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [path, setPath] = useState<PathSegment[]>([]);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [viewType, setViewType] = useState<ViewType>(ViewType.GRID);
    const [sort, setSort] = useState<SortOption>({ field: 'name', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<FileNode | null>(null);
    
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<FileNode | null>(null);

    const mainAreaRef = useRef<HTMLElement>(null);

    const navigateTo = useCallback(async (newPath: PathSegment[]) => {
        if (!rootHandle || !newPath.length) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const newHandle = newPath[newPath.length - 1].handle;
            const directoryId = newPath.map(p => p.name).join('/');
            
            const fileListFromDb = await getFilesForDirectory(directoryId);
            
            // Augment the data from DB with live handles
            const fileListWithHandles = await Promise.all(
                fileListFromDb.map(async (file) => {
                    try {
                        const handle = file.isDirectory
                            ? await newHandle.getDirectoryHandle(file.name)
                            : await newHandle.getFileHandle(file.name);
                        return { ...file, handle };
                    } catch (e) {
                        console.warn(`Could not re-acquire handle for ${file.path}`, e);
                        return null; // File might have been deleted
                    }
                })
            );

            const finalFileList = fileListWithHandles.filter(Boolean) as FileNode[];

            setFiles(finalFileList);
            setPath(newPath);
            setCurrentHandle(newHandle);
            setSelectedIds(new Set());
        } catch (e) {
            console.error("Failed to navigate and load files:", e);
            setError(e instanceof Error ? e.message : "Could not read directory contents.");
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [rootHandle]);

    const openDirectory = useCallback(async () => {
        if (isPickerOpen) return;

        setIsPickerOpen(true);
        setLoading(true);
        setError(null);
        try {
            const dirHandle = await fileSystemService.openDirectoryAndIngest();
            if (dirHandle) {
                setRootHandle(dirHandle);
            } else {
                setLoading(false); // User cancelled the picker
            }
        } catch (e) {
            console.error("Error opening and ingesting directory:", e);
            setError("Failed to process directory. Please try again.");
            setLoading(false);
        } finally {
            setIsPickerOpen(false);
        }
    }, [isPickerOpen]);

    useEffect(() => {
        if (rootHandle) {
            navigateTo([{ name: rootHandle.name, handle: rootHandle }]);
        }
    }, [rootHandle, navigateTo]);


    const breadcrumbNavigate = useCallback((index: number) => {
        const newPath = path.slice(0, index + 1);
        navigateTo(newPath);
    }, [path, navigateTo]);


    const refresh = useCallback(() => {
        if (path.length > 0) {
            navigateTo(path);
        }
    }, [path, navigateTo]);
    
    const handleApplyOrganization = async (suggestions: OrganizationSuggestion[]) => {
      if (!currentHandle) return;
      setLoading(true);
      try {
        const currentDirectoryPath = path.map(p => p.name).join('/');
        await fileSystemService.applyOrganization(currentHandle, suggestions, currentDirectoryPath);
        refresh();
      } catch (e) {
        console.error("Failed to apply organization", e);
        setError(e instanceof Error ? e.message : "An error occurred while organizing files.");
      } finally {
        setLoading(false);
      }
    };
    
    const handleCreateFolder = async (folderName: string) => {
        if (!currentHandle || !folderName) return;
        try {
            const directoryId = path.map(p => p.name).join('/');
            await fileSystemService.createDirectory(currentHandle, folderName, directoryId);
            refresh();
        } catch (e) {
            console.error("Failed to create folder", e);
            setError(e instanceof Error ? e.message : "Could not create folder.");
        }
    };

    const handleRename = async (newName: string) => {
      if (!renameTarget || !currentHandle || !newName) return;
      try {
        const currentDirectoryPath = path.map(p => p.name).join('/');
        await fileSystemService.renameItem(currentHandle, currentDirectoryPath, renameTarget.name, newName);
        refresh();
      } catch (e) {
        console.error("Failed to rename file:", e);
        setError(e instanceof Error ? e.message : "Could not rename.");
      }
    }

    const handleDelete = async () => {
        if (!currentHandle || selectedIds.size === 0) return;
        const selectedFiles = files.filter(f => selectedIds.has(f.id));
        if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} item(s)?`)) {
            try {
                await fileSystemService.deleteFiles(currentHandle, selectedFiles);
                refresh();
            } catch (e) {
                console.error("Failed to delete files:", e);
                setError(e instanceof Error ? e.message : "Could not delete items.");
            }
        }
    };
    
    const onFileOpen = useCallback((file: FileNode) => {
        if (file.isDirectory) {
            const newPath = [...path, { name: file.name, handle: file.handle as FileSystemDirectoryHandle }];
            navigateTo(newPath);
        } else {
            // Open file in editor
            const fileNode = files.find(f => f.name === file.name && !f.isDirectory);
            if (fileNode) {
                fileSystemService.readFileContent(fileNode.handle as FileSystemFileHandle)
                    .then(content => {
                        setEditingFile({ ...fileNode, content });
                    })
                    .catch(e => {
                        console.error(`Error reading file for editor: ${e}`);
                        setError(e instanceof Error ? e.message : "Could not open file in editor.");
                    });
            }
        }
    }, [path, navigateTo, files]);
    
    const handleSaveFile = async (fileNode: FileNode, newContent: string) => {
        try {
            await fileSystemService.saveFileContent(fileNode.handle as FileSystemFileHandle, newContent);
            setEditingFile(null);
            refresh();
        } catch (e) {
            console.error("Failed to save file", e);
            setError(e instanceof Error ? e.message : "Could not save file.");
        }
    };

    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    const canSmartOrganize = files.some(f => !f.isDirectory);
    
    const contextMenuItems: ContextMenuItem[] = [
        ...(selectedFiles.length > 0 ? [
            { label: 'Rename', icon: <Icon name="rename" size={16} />, action: () => setRenameTarget(selectedFiles[0]), disabled: selectedFiles.length !== 1 },
            { label: 'Delete', icon: <Icon name="trash" size={16} />, action: handleDelete, disabled: selectedFiles.length === 0 },
            { isSeparator: true },
        ] : []),
        { label: 'New Folder', icon: <Icon name="folderPlus" size={16} />, action: () => setIsCreateFolderModalOpen(true) },
        { label: 'Smart Organize Files', icon: <Icon name="sparkles" size={16} />, action: () => setIsOrganizeModalOpen(true), disabled: !canSmartOrganize },
    ];

    if (!rootHandle) {
        return (
            <div className="w-screen h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 gap-4">
                <Icon name="folderOpen" size={64} className="text-gray-400" />
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Gemini File Manager</h1>
                <p className="text-gray-500 dark:text-gray-400">Select a folder to start managing your files.</p>
                <button 
                    onClick={openDirectory} 
                    disabled={isPickerOpen}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-400 disabled:cursor-wait"
                >
                    {isPickerOpen ? 'Opening...' : 'Open Folder'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full font-sans text-sm antialiased flex-col">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar onOpenFolder={openDirectory} />
                <main className="flex-1 flex flex-col" ref={mainAreaRef}>
                    <Header 
                        path={path}
                        viewType={viewType}
                        onViewChange={setViewType}
                        onBreadcrumbNavigate={breadcrumbNavigate}
                        onSmartOrganize={() => setIsOrganizeModalOpen(true)}
                        disableSmartOrganize={!canSmartOrganize}
                    />

                    <FileView
                        files={files}
                        viewType={viewType}
                        sort={sort}
                        onSortChange={setSort}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onFileOpen={onFileOpen}
                        loading={loading}
                        error={error}
                        onRetry={refresh}
                    />

                    {selectedFiles.length > 0 && 
                        <Footer 
                            selectedFiles={selectedFiles} 
                            onRename={() => setRenameTarget(selectedFiles[0])} 
                            onDelete={handleDelete}
                            onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
                        />}
                </main>
            </div>
            {isTerminalOpen && rootHandle && currentHandle && (
                <Terminal 
                    rootHandle={rootHandle}
                    currentHandle={currentHandle}
                    path={path}
                    changeDirectory={navigateTo}
                    openEditor={(fileName) => {
                        const file = files.find(f => f.name === fileName);
                        if(file) onFileOpen(file);
                    }}
                    refresh={refresh}
                />
            )}
            
            <ContextMenu items={contextMenuItems} triggerRef={mainAreaRef} />
            
            <SmartOrganizeModal 
              isOpen={isOrganizeModalOpen} 
              onClose={() => setIsOrganizeModalOpen(false)}
              files={files.filter(f => !f.isDirectory)} 
              onApply={handleApplyOrganization}
            />

            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
                onSubmit={handleCreateFolder}
            />

            {renameTarget && (
                 <RenameModal
                    isOpen={!!renameTarget}
                    onClose={() => setRenameTarget(null)}
                    onSubmit={handleRename}
                    originalName={renameTarget.name}
                />
            )}
            
            {editingFile && (
                <EditorModal
                    file={editingFile}
                    onClose={() => setEditingFile(null)}
                    onSave={handleSaveFile}
                />
            )}
        </div>
    );
};

export default App;
