import React, { useRef, useEffect } from 'react';
import { useContextMenu } from '../../hooks/useContextMenu';
import Icon from './Icon';

export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isSeparator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerRef: React.RefObject<HTMLElement>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, triggerRef }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { visible, position, setVisible } = useContextMenu(triggerRef, menuRef);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, setVisible]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-lg py-1.5 z-50 border border-gray-200 dark:border-gray-700 min-w-[220px] animate-scale-in"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ul className="flex flex-col">
        {items.map((item, index) => {
          if (item.isSeparator) {
            return <hr key={index} className="my-1 border-gray-200 dark:border-gray-700" />;
          }
          return (
            <li key={index}>
              <button
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.disabled && item.action) {
                    item.action();
                    setVisible(false);
                  }
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 flex items-center gap-3 rounded-md mx-1 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-800 dark:disabled:hover:text-gray-200"
              >
                {item.icon || <span className="w-5 h-5" />}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ContextMenu;