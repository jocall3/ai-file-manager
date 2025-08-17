
import React from 'react';
import { ViewType } from '../types';
import type { FileNode, SortOption } from '../types';
import FileList from './FileList';
import FileGrid from './FileGrid';
import Icon from './ui/Icon';

interface FileViewProps {
  files: FileNode[];
  viewType: ViewType;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onFileOpen: (file: FileNode) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const FileView: React.FC<FileViewProps> = ({
  files,
  viewType,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onFileOpen,
  loading,
  error,
  onRetry,
}) => {
  const handleContainerClick = () => {
    onSelectionChange(new Set());
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Icon name="loader" className="animate-spin text-blue-500 mb-4" size={48} />
        <p>Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 p-4">
        <Icon name="warning" className="mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Error Loading Files</h3>
        <p className="text-center mb-4">{error}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Icon name="folderOpen" className="mb-4" size={48} />
        <p>This folder is empty.</p>
      </div>
    );
  }

  const commonProps = {
    files,
    sort,
    selectedIds,
    onSelectionChange,
    onFileOpen,
  };

  return (
    <div className="flex-1 overflow-y-auto p-4" onClick={handleContainerClick}>
      {viewType === ViewType.LIST ? (
        <FileList {...commonProps} onSortChange={onSortChange} />
      ) : (
        <FileGrid {...commonProps} />
      )}
    </div>
  );
};

export default FileView;
