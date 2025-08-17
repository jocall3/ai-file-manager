import React from 'react';
import type { FileNode } from '../types';
import Icon, { iconMap } from './ui/Icon';

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

  if (viewType === 'list') {
    return (
      <tr
        className={`cursor-pointer rounded-lg transition-colors duration-150 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/30'}`}
        onClick={(e) => onClick(file, e)}
        onDoubleClick={() => onDoubleClick(file)}
        aria-selected={isSelected}
      >
        <td className="p-2 flex items-center gap-3 truncate">
          <Icon name={iconName} className={iconColor} />
          <span className="truncate">{file.name}</span>
        </td>
        <td className="p-2 text-gray-600 dark:text-gray-400">{file.isDirectory ? '—' : formatBytes(file.size)}</td>
        <td className="p-2 text-gray-600 dark:text-gray-400">{formatDate(file.modified)}</td>
      </tr>
    );
  }

  return (
    <div
      className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/30'}`}
      onClick={(e) => onClick(file, e)}
      onDoubleClick={() => onDoubleClick(file)}
      aria-selected={isSelected}
    >
      <div className="w-24 h-24 flex items-center justify-center text-5xl mb-2">
        <Icon name={iconName} className={iconColor} size={viewType === 'grid' ? 48 : 20} />
      </div>
      <p className="text-center text-xs break-all w-full truncate">{file.name}</p>
    </div>
  );
};

export default FileItem;