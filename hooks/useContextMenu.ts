// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import { useState, useEffect, useCallback, RefObject } from 'react';

export const useContextMenu = (triggerRef: RefObject<HTMLElement>, menuRef: RefObject<HTMLElement>) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
      event.preventDefault();
      setVisible(true);
      
      const { clientX: x, clientY: y } = event;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Use setTimeout to allow the menu to render and get its dimensions
      setTimeout(() => {
        if (menuRef.current) {
          const menuWidth = menuRef.current.offsetWidth;
          const menuHeight = menuRef.current.offsetHeight;

          setPosition({
            x: x + menuWidth > screenWidth ? screenWidth - menuWidth - 10 : x,
            y: y + menuHeight > screenHeight ? screenHeight - menuHeight - 10 : y,
          });
        }
      }, 0);
    }
  }, [triggerRef, menuRef]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Close if clicking outside the menu
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setVisible(false);
    }
  }, [menuRef]);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleContextMenu, handleClickOutside]);

  return { visible, setVisible, position };
};
