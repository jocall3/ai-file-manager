
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ViewType } from './types';
import type { FileNode, SortOption, OrganizationSuggestion, ModalState, StorableFileNode } from './types';
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
import * as geminiService from './services/geminiService';
import { getFilesForDirectory } from './services/database';
import Terminal from './components/terminal/Terminal';
import EditorModal from './components/modals/EditorModal';
import ExplainFolderModal from './components/modals/ExplainFolderModal';
import AIActionModal from './components/modals/AIActionModal';
import loggingService from './services/loggingService';

type PathSegment = { name: string; handle: FileSystemDirectoryHandle };

const isTextFile = (fileName: string) => {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.html', '.css', '.py', '.rb', '.java', '.c', '.cpp', '.go', '.rs'];
    return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

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

    // Centralized modal state
    const [modal, setModal] = useState<ModalState | null>(null);

    // Panels
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    
    // Search State
    const [searchResults, setSearchResults] = useState<FileNode[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const mainAreaRef = useRef<HTMLElement>(null);

    const navigateTo = useCallback(async (newPath: PathSegment[]) => {
        if (!rootHandle || !newPath.length) return;
        
        setLoading(true);
        setError(null);
        setSearchResults(null); // Clear search on navigation
        
        try {
            const newHandle = newPath[newPath.length - 1].handle;
            const directoryId = newPath.map(p => p.name).join('/');
            
            const fileListFromDb: StorableFileNode[] = await getFilesForDirectory(directoryId);
            
            const fileListWithHandles = await Promise.all(
                fileListFromDb.map(async (storableFile) => {
                    try {
                        const handle = storableFile.isDirectory
                            ? await newHandle.getDirectoryHandle(storableFile.name)
                            : await newHandle.getFileHandle(storableFile.name);
                        return { ...storableFile, handle } as FileNode;
                    } catch (e) {
                        loggingService.warn('App', `Could not re-acquire handle for ${storableFile.path}`, e);
                        return null;
                    }
                })
            );

            const finalFileList = fileListWithHandles.filter(Boolean) as FileNode[];

            setFiles(finalFileList);
            setPath(newPath);
            setCurrentHandle(newHandle);
            setSelectedIds(new Set());
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Could not read directory contents.";
            loggingService.error('App', 'Failed to navigate and load files:', e);
            setError(errorMessage);
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
                setLoading(false);
            }
        } catch (e) {
            loggingService.error('App', 'Error opening and ingesting directory:', e);
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
        const errorMessage = e instanceof Error ? e.message : "An error occurred while organizing files.";
        loggingService.error('App', 'Failed to apply organization', e);
        setError(errorMessage);
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
            const errorMessage = e instanceof Error ? e.message : "Could not create folder.";
            loggingService.error('App', 'Failed to create folder', e);
            setError(errorMessage);
        }
    };

    const handleRename = async (newName: string) => {
      if (!currentHandle || modal?.type !== 'rename' || !newName) return;
      try {
        const currentDirectoryPath = path.map(p => p.name).join('/');
        await fileSystemService.renameItem(currentHandle, currentDirectoryPath, modal.target.name, newName);
        refresh();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Could not rename.";
        loggingService.error('App', 'Failed to rename file:', e);
        setError(errorMessage);
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
                const errorMessage = e instanceof Error ? e.message : "Could not delete items.";
                loggingService.error('App', 'Failed to delete files:', e);
                setError(errorMessage);
            }
        }
    };
    
    const onFileOpen = useCallback((file: FileNode) => {
        if (file.isDirectory) {
            const newPath = [...path, { name: file.name, handle: file.handle as FileSystemDirectoryHandle }];
            navigateTo(newPath);
        } else {
            const fileNode = files.find(f => f.name === file.name && !f.isDirectory);
            if (fileNode) {
                fileSystemService.readFileContent(fileNode.handle as FileSystemFileHandle)
                    .then(content => {
                        setModal({ type: 'edit-file', file: { ...fileNode, content }});
                    })
                    .catch(e => {
                        const errorMessage = e instanceof Error ? e.message : "Could not open file in editor.";
                        loggingService.error('App', `Error reading file for editor: ${file.name}`, e);
                        setError(errorMessage);
                    });
            }
        }
    }, [path, navigateTo, files]);
    
    const handleSaveFile = async (fileNode: FileNode, newContent: string) => {
        try {
            await fileSystemService.saveFileContent(fileNode.handle as FileSystemFileHandle, newContent);
            setModal(null);
            refresh();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Could not save file.";
            loggingService.error('App', `Failed to save file: ${fileNode.name}`, e);
            setError(errorMessage);
        }
    };

    const handleSemanticSearch = async (query: string) => {
        if (!query) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        setError(null);
        try {
            const filesWithContent = await Promise.all(
                files
                    .filter(f => !f.isDirectory && isTextFile(f.name))
                    .map(async f => ({
                        name: f.name,
                        content: await fileSystemService.readFileContent(f.handle as FileSystemFileHandle)
                    }))
            );
            const matchingFileNames = await geminiService.performSemanticSearch(query, filesWithContent);
            const resultSet = new Set(matchingFileNames);
            setSearchResults(files.filter(f => resultSet.has(f.name)));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Semantic search failed.";
            loggingService.error('App', 'Semantic search failed:', e);
            setError(errorMessage);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    const canSmartOrganize = files.some(f => !f.isDirectory);
    
    const getContextMenuItems = (): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (selectedFiles.length > 0) {
            items.push({ label: 'Rename', icon: <Icon name="rename" size={16} />, action: () => setModal({ type: 'rename', target: selectedFiles[0] }), disabled: selectedFiles.length !== 1 });
            items.push({ label: 'Delete', icon: <Icon name="trash" size={16} />, action: handleDelete, disabled: selectedFiles.length === 0 });
        }

        if (selectedFiles.length === 1) {
            const file = selectedFiles[0];
            if (!file.isDirectory && isTextFile(file.name)) {
                items.push({ isSeparator: true });
                items.push({ label: 'Summarize with AI', icon: <Icon name="summary" size={16} />, action: () => setModal({ type: 'ai-action', request: { action: 'summarize', file } }) });
            }
        }
        
        items.push({ isSeparator: true });
        items.push({ label: 'New Folder', icon: <Icon name="folderPlus" size={16} />, action: () => setModal({ type: 'create-folder' }) });
        items.push({ label: 'Smart Organize Files', icon: <Icon name="sparkles" size={16} />, action: () => setModal({ type: 'smart-organize' }), disabled: !canSmartOrganize });
        
        return items;
    };


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

    const displayedFiles = searchResults !== null ? searchResults : files;

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
                        onSmartOrganize={() => setModal({ type: 'smart-organize' })}
                        onExplainFolder={() => setModal({ type: 'explain-folder' })}
                        disableSmartOrganize={!canSmartOrganize}
                        onSearch={handleSemanticSearch}
                        isSearching={isSearching}
                        onClearSearch={() => setSearchResults(null)}
                        isSearchResults={searchResults !== null}
                    />

                    <FileView
                        files={displayedFiles}
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
                            onRename={() => setModal({ type: 'rename', target: selectedFiles[0] })} 
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
            
            <ContextMenu items={getContextMenuItems()} triggerRef={mainAreaRef} />
            
            {modal?.type === 'smart-organize' &&
              <SmartOrganizeModal 
                isOpen={true} 
                onClose={() => setModal(null)}
                files={files.filter(f => !f.isDirectory)} 
                onApply={handleApplyOrganization}
              />
            }

            {modal?.type === 'explain-folder' &&
              <ExplainFolderModal
                isOpen={true}
                onClose={() => setModal(null)}
                files={files}
              />
            }

            {modal?.type === 'ai-action' &&
              <AIActionModal
                request={modal.request}
                onClose={() => setModal(null)}
              />
            }

            {modal?.type === 'create-folder' &&
              <CreateFolderModal
                isOpen={true}
                onClose={() => setModal(null)}
                onSubmit={handleCreateFolder}
              />
            }

            {modal?.type === 'rename' &&
              <RenameModal
                isOpen={true}
                onClose={() => setModal(null)}
                onSubmit={handleRename}
                originalName={modal.target.name}
              />
            }
            
            {modal?.type === 'edit-file' &&
              <EditorModal
                file={modal.file}
                onClose={() => setModal(null)}
                onSave={handleSaveFile}
              />
            }
        </div>
    );
};

export default App;