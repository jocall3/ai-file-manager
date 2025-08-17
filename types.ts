export interface FileNode {
  id: string; // The file name, used as a local ID within its directory
  name: string;
  isDirectory: boolean;
  path: string; // Full path relative to the root handle
  handle: FileSystemHandle;
  parentId: string | null;
  size: number;
  modified: number;
  cid?: string; // Content ID (hash) for files
  content?: string; // File content for the editor
}

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
