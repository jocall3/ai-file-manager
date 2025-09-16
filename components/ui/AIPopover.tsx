import React from 'react';
import Icon from './Icon';

interface AIPopoverProps {
  content: string | null;
  isLoading: boolean;
}

const AIPopover: React.FC<AIPopoverProps> = ({ content, isLoading }) => {
  if (!content && !isLoading) {
    return null;
  }

  return (
    <div
      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-800 text-white text-xs rounded-md shadow-lg p-3 z-20 pointer-events-none animate-scale-in"
      style={{ transformOrigin: 'left center' }}
    >
      <div className="flex items-start gap-2">
        <Icon name="sparkles" size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-grow">
          <h4 className="font-bold mb-1">AI Preview</h4>
          {isLoading && <p className="text-gray-400">Generating preview...</p>}
          {content && <p>{content}</p>}
        </div>
      </div>
    </div>
  );
};

export default AIPopover;
