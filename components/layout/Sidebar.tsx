
import React from 'react';
import Icon from '../ui/Icon';

interface SidebarProps {
  onOpenFolder: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenFolder }) => {
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 p-4 flex flex-col">
      <div className="flex items-center mb-6 pl-2">
        <Icon name="hardDrive" className="text-blue-500" size={24} />
        <h1 className="text-lg font-bold ml-2 text-gray-800 dark:text-white">File Manager</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-2">
            <button onClick={onOpenFolder} className="w-full flex items-center p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-left">
              <Icon name="folderOpen" className="mr-3" /> My Files
            </button>
          </li>
          {/* Static links for demonstration */}
          <li className="mb-2">
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Icon name="clock" className="mr-3" /> Recent
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Icon name="star" className="mr-3" /> Starred
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Icon name="trash" className="mr-3" /> Trash
            </a>
          </li>
        </ul>
      </nav>
      <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
          <p>Storage information would go here.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
