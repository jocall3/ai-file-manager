import React from 'react';
import { ViewType } from '../../types';
import Icon from '../ui/Icon';
import Breadcrumbs from '../ui/Breadcrumbs';
import SearchBar from '../ui/SearchBar';

interface HeaderProps {
  path: { name: string; handle: FileSystemDirectoryHandle }[];
  viewType: ViewType;
  onViewChange: (viewType: ViewType) => void;
  onBreadcrumbNavigate: (index: number) => void;
  onSmartOrganize: () => void;
  onExplainFolder: () => void;
  disableSmartOrganize: boolean;
  onSearch: (query: string) => void;
  isSearching: boolean;
  onClearSearch: () => void;
  isSearchResults: boolean;
}

const Header: React.FC<HeaderProps> = ({
  path,
  viewType,
  onViewChange,
  onBreadcrumbNavigate,
  onSmartOrganize,
  onExplainFolder,
  disableSmartOrganize,
  onSearch,
  isSearching,
  onClearSearch,
  isSearchResults,
}) => {
  return (
    <header className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0 h-14">
      <div className="flex-1 min-w-0">
        <Breadcrumbs path={path} onNavigate={onBreadcrumbNavigate} />
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
          <SearchBar onSearch={onSearch} isSearching={isSearching} onClear={onClearSearch} isResults={isSearchResults} />
          
          <button 
              onClick={onExplainFolder}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
              aria-label="Explain this Folder with AI"
              title="Explain this Folder with AI"
          >
              <Icon name="brain" size={18} />
          </button>

          <button 
              onClick={onSmartOrganize}
              disabled={disableSmartOrganize}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Smart Organize Files"
              title="Smart Organize Files"
          >
              <Icon name="sparkles" size={18} />
          </button>
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
            <button
                onClick={() => onViewChange(ViewType.LIST)}
                className={`p-1.5 rounded-md ${viewType === ViewType.LIST ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
                aria-label="List view"
                title="List view"
            >
                <Icon name="list" size={18} />
            </button>
            <button
                onClick={() => onViewChange(ViewType.GRID)}
                className={`p-1.5 rounded-md ${viewType === ViewType.GRID ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
                aria-label="Grid view"
                title="Grid view"
            >
                <Icon name="grid" size={18} />
            </button>
          </div>
      </div>
    </header>
  );
};

export default Header;
