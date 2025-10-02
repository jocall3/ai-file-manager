// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// Represents the serializable file metadata stored in IndexedDB.
// It purposefully omits the non-serializable `handle`.
export interface StorableFileNode {
  id: string; // The file name, used as a local ID within its directory
  name: string;
  isDirectory: boolean;
  path: string; // Full path relative to the root handle
  parentId: string | null;
  size: number;
  modified: number;
  cid?: string; // Content ID (hash) for files
}

// Represents a live file node in the application's memory.
// It includes the `StorableFileNode` data plus the live `handle`.
export interface FileNode extends StorableFileNode {
  handle: FileSystemHandle;
  content?: string; // File content for the editor
}

// Represents a segment in the current navigation path.
export type PathSegment = {
  name: string;
  handle: FileSystemDirectoryHandle;
};

export enum ViewType {
  GRID = 'grid',
  LIST = 'list',
}

export type SortField = 'name' | 'size' | 'modified';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export interface OrganizationSuggestion {
  folderName: string;
  fileNames: string[];
}

export type AIAction = 'summarize' | 'explain_code';

export interface AIActionRequest {
  action: AIAction;
  file: FileNode;
}

// Discriminated union for managing all modals from a single state
export type ModalState =
  | { type: 'smart-organize' }
  | { type: 'explain-folder' }
  | { type: 'ai-action'; request: AIActionRequest }
  | { type: 'create-folder' }
  | { type: 'rename'; target: FileNode }
  | { type: 'edit-file'; file: FileNode };