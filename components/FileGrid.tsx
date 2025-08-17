
import React, { useMemo } from 'react';
import type { FileNode, SortOption } from '../types';
import FileItem from './FileItem';

interface FileGridProps {
  files: FileNode[];
  sort: SortOption;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onFileOpen: (file: FileNode) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, sort, selectedIds, onSelectionChange, onFileOpen }) => {
    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
    
          let comparison = 0;
          if (sort.field === 'name') {
            comparison = a.name.localeCompare(b.name);
          } else if (sort.field === 'size') {
            comparison = a.size - b.size;
          } else if (sort.field === 'modified') {
            comparison = b.modified - a.modified;
          }
    
          return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [files, sort]);
    
    const handleItemClick = (file: FileNode, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = e.ctrlKey || e.metaKey ? new Set(selectedIds) : new Set<string>();
        if (newSelection.has(file.id)) {
            newSelection.delete(file.id);
        } else {
            newSelection.add(file.id);
        }
        onSelectionChange(newSelection);
    };

    const handleItemDoubleClick = (file: FileNode) => {
        onFileOpen(file);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {sortedFiles.map(file => (
                <FileItem
                    key={file.id}
                    file={file}
                    viewType="grid"
                    isSelected={selectedIds.has(file.id)}
                    onClick={handleItemClick}
                    onDoubleClick={handleItemDoubleClick}
                />
            ))}
        </div>
    );
};

export default FileGrid;
