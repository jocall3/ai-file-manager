// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import type { FileNode } from '../../types';
import Icon from '../ui/Icon';

interface FooterProps {
  selectedFiles: FileNode[];
  onRename: () => void;
  onDelete: () => void;
  onToggleTerminal: () => void;
}

const Footer: React.FC<FooterProps> = ({ selectedFiles, onRename, onDelete, onToggleTerminal }) => {
  const count = selectedFiles.length;
  if (count === 0) return null;

  return (
    <footer className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-slide-up flex-shrink-0">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <span className="text-sm font-semibold">{count} item{count > 1 ? 's' : ''} selected</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={onRename}
            disabled={count !== 1}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Rename"
            aria-label="Rename selected item"
          >
            <Icon name="rename" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Delete"
            aria-label="Delete selected items"
          >
            <Icon name="trash" />
          </button>
           <button
            onClick={onToggleTerminal}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Toggle Terminal"
            aria-label="Toggle Terminal"
          >
            <Icon name="terminal" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
