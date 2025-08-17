
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal as XTerminal } from 'xterm';
import { executeCommand } from '../../services/terminalService';

type PathSegment = { name: string; handle: FileSystemDirectoryHandle };
interface TerminalProps {
  rootHandle: FileSystemDirectoryHandle;
  currentHandle: FileSystemDirectoryHandle;
  path: PathSegment[];
  changeDirectory: (path: PathSegment[]) => Promise<void>;
  openEditor: (fileName: string) => void;
  refresh: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ rootHandle, currentHandle, path, changeDirectory, openEditor, refresh }) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const [height, setHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  
  const propsRef = useRef({ rootHandle, currentHandle, path, changeDirectory, openEditor, refresh });
  useEffect(() => {
    propsRef.current = { rootHandle, currentHandle, path, changeDirectory, openEditor, refresh };
  }, [rootHandle, currentHandle, path, changeDirectory, openEditor, refresh]);

  const fitAddonRef = useRef(new FitAddon());

  const inputRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (!terminalContainerRef.current) return;
    
    const term = new XTerminal({
        cursorBlink: true,
        convertEol: true,
        theme: { background: '#000000', foreground: '#ffffff' }
    });
    xtermRef.current = term;
    term.loadAddon(fitAddonRef.current);
    term.open(terminalContainerRef.current);
    fitAddonRef.current.fit();

    const prompt = () => {
        if (!term) return;
        const pathString = `/${propsRef.current.path.map(p => p.name).join('/')}`;
        term.write(`\r\n\x1b[1;32m${pathString}\x1b[0m $ `);
    };

    term.writeln('Welcome to the integrated terminal.');
    prompt();

    const handleCommand = async (command: string) => {
        historyRef.current.push(command);
        historyIndexRef.current = historyRef.current.length;
        
        const output = await executeCommand(command, propsRef.current);
        
        if (output === 'clear') {
            term.clear();
        } else if (output) {
            term.writeln(output.replace(/\n/g, '\r\n'));
        }
        prompt();
    };

    const onKeyDisposable = term.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
        if (domEvent.key === 'Enter') {
            const command = inputRef.current.trim();
            term.write('\r\n');
            if (command) {
                handleCommand(command);
            } else {
                prompt();
            }
            inputRef.current = '';
        } else if (domEvent.key === 'Backspace') {
            if (inputRef.current.length > 0) {
                term.write('\b \b');
                inputRef.current = inputRef.current.slice(0, -1);
            }
        } else if (domEvent.key === 'ArrowUp') {
            if (historyIndexRef.current > 0) {
                historyIndexRef.current--;
                const command = historyRef.current[historyIndexRef.current];
                term.write('\b \b'.repeat(inputRef.current.length));
                term.write(command);
                inputRef.current = command;
            }
        } else if (domEvent.key === 'ArrowDown') {
            if (historyIndexRef.current < historyRef.current.length - 1) {
                historyIndexRef.current++;
                const command = historyRef.current[historyIndexRef.current];
                term.write('\b \b'.repeat(inputRef.current.length));
                term.write(command);
                inputRef.current = command;
            } else if (historyIndexRef.current === historyRef.current.length - 1) {
                historyIndexRef.current++;
                term.write('\b \b'.repeat(inputRef.current.length));
                inputRef.current = '';
            }
        } else if (!domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
            // A simple way to filter out non-printable characters like Shift, ArrowLeft etc.
            if (key.length === 1) {
                term.write(key);
                inputRef.current += key;
            }
        }
    });

    return () => {
      onKeyDisposable.dispose();
      term.dispose();
      xtermRef.current = null;
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (xtermRef.current) {
        fitAddonRef.current.fit();
    }
  }, [height]);
  
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const onResize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 50 && newHeight < window.innerHeight - 200) {
        setHeight(newHeight);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onResize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, onResize, stopResizing]);

  return (
    <div
      className="flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      <div
        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500"
        onMouseDown={startResizing}
      />
      <div className="h-[calc(100%-6px)] w-full bg-black text-white">
        <div ref={terminalContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
};

export default Terminal;
