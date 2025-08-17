
import React from 'react';
import Icon from './Icon';

interface BreadcrumbsProps {
    path: { name: string; handle: FileSystemDirectoryHandle }[];
    onNavigate: (index: number) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {path.map((part, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && (
                        <Icon name="chevronRight" size={16} className="mx-1 flex-shrink-0" />
                    )}
                    <button
                        onClick={() => onNavigate(index)}
                        disabled={index === path.length - 1}
                        className={`px-2 py-1.5 rounded-md transition-colors ${
                            index === path.length - 1
                                ? 'text-gray-800 dark:text-gray-100 font-semibold'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        aria-current={index === path.length - 1 ? 'page' : undefined}
                    >
                        {part.name}
                    </button>
                </div>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
