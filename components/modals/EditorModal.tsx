import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { initVimMode } from 'monaco-vim';
import type { FileNode } from '../../types';
import Icon from '../ui/Icon';

interface EditorModalProps {
  file: FileNode;
  onClose: () => void;
  onSave: (file: FileNode, newContent: string) => void;
}

const EditorModal: React.FC<EditorModalProps> = ({ file, onClose, onSave }) => {
  const [content, setContent] = useState<string | undefined>(file.content);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const vimModeRef = useRef<any>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    const vimMode = initVimMode(editor, statusBarRef.current);
    vimModeRef.current = vimMode;
  };

  useEffect(() => {
    return () => {
      // Dispose of Vim mode when the component unmounts
      vimModeRef.current?.dispose();
    };
  }, []);
  
  const handleSave = async () => {
      if (content === undefined) return;
      setIsSaving(true);
      await onSave(file, content);
      setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 animate-scale-in">
        <div className="flex items-center justify-between p-2 pl-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="fileText" className="text-gray-400" size={18} />
            <h2 className="text-lg font-mono text-gray-200">{file.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
            >
              {isSaving ? <Icon name="loader" className="animate-spin" size={18} /> : <Icon name="save" size={18} />}
              Save
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors">
              <Icon name="close" size={24} />
            </button>
          </div>
        </div>
        <div className="flex-grow relative">
          <Editor
            height="100%"
            language={file.name.split('.').pop()}
            theme="vs-dark"
            value={content}
            onChange={(value) => setContent(value)}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
            }}
          />
        </div>
        <div ref={statusBarRef} className="flex-shrink-0 p-1 px-4 text-xs bg-gray-900 text-gray-300 font-mono text-right"></div>
      </div>
    </div>
  );
};

export default EditorModal;
