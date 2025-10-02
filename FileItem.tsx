// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState } from 'react';
import type { FileNode } from '../types';
import Icon, { iconMap } from './ui/Icon';
import AIPopover from './ui/AIPopover';
import { useAIPreview } from '../hooks/useAIPreview';

interface FileItemProps {
  file: FileNode;
  viewType: 'list' | 'grid';
  isSelected: boolean;
  onClick: (file: FileNode, e: React.MouseEvent) => void;
  onDoubleClick: (file: FileNode) => void;
}

const getFileIconName = (file: FileNode): keyof typeof iconMap => {
  if (file.isDirectory) return "folder";
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'fileText';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return 'fileImage';
    case 'mp4': case 'mov': case 'avi': case 'webm': return 'fileVideo';
    case 'mp3': case 'wav': case 'aac': case 'flac': return 'fileAudio';
    default: return 'file';
  }
};

const getFileIconColor = (file: FileNode): string => {
    if (file.isDirectory) return "text-yellow-500";
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return "text-red-500";
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return "text-blue-500";
        case 'mp4': case 'mov': case 'avi': case 'webm': return "text-purple-500";
        case 'mp3': case 'wav': case 'aac': case 'flac': return "text-pink-500";
        default: return "text-gray-500 dark:text-gray-400";
    }
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const FileItem: React.FC<FileItemProps> = ({ file, viewType, isSelected, onClick, onDoubleClick }) => {
  const iconName = getFileIconName(file);
  const iconColor = getFileIconColor(file);
  const [isHovered, setIsHovered] = useState(false);
  const { preview, isLoading } = useAIPreview(file, isHovered);

  const containerProps = {
    className: `relative cursor-pointer rounded-lg transition-colors duration-150 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50 outline-2 outline-blue-500' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/30'}`,
    onClick: (e: React.MouseEvent) => onClick(file, e),
    onDoubleClick: () => onDoubleClick(file),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    'aria-selected': isSelected,
  };

  if (viewType === 'list') {
    return (
      <tr {...containerProps} role="row">
        <td role="gridcell" className="p-2 flex items-center gap-3 truncate">
          <Icon name={iconName} className={iconColor} />
          <span className="truncate">{file.name}</span>
          <AIPopover content={preview} isLoading={isLoading} />
        </td>
        <td role="gridcell" className="p-2 text-gray-600 dark:text-gray-400">{file.isDirectory ? '—' : formatBytes(file.size)}</td>
        <td role="gridcell" className="p-2 text-gray-600 dark:text-gray-400">{formatDate(file.modified)}</td>
      </tr>
    );
  }

  return (
    <div {...containerProps} role="gridcell" className={`${containerProps.className} flex flex-col items-center p-2`}>
       <AIPopover content={preview} isLoading={isLoading} />
      <div className="w-24 h-24 flex items-center justify-center text-5xl mb-2">
        <Icon name={iconName} className={iconColor} size={viewType === 'grid' ? 48 : 20} />
      </div>
      <p className="text-center text-xs break-all w-full truncate">{file.name}</p>
    </div>
  );
};

export default FileItem;
