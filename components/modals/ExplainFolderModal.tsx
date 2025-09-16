import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { explainFolder } from '../../services/geminiService';
import type { FileNode } from '../../types';
import Icon from '../ui/Icon';

interface ExplainFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
}

const ExplainFolderModal: React.FC<ExplainFolderModalProps> = ({ isOpen, onClose, files }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    if (files.length === 0) {
        setExplanation("This folder is empty, so there's not much to say about it!");
        return;
    };

    setIsLoading(true);
    setError(null);
    setExplanation(null);
    
    try {
      const fileNames = files.map(f => f.isDirectory ? `${f.name}/` : f.name);
      const result = await explainFolder(fileNames);
      setExplanation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    if (isOpen) {
      fetchExplanation();
    }
  }, [isOpen, fetchExplanation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="brain" className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Explain this Folder</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <Icon name="loader" className="animate-spin text-blue-500 mb-4" size={48} />
              <p className="text-lg">Gemini is analyzing the folder...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <Icon name="warning" className="mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Could not get explanation</h3>
              <p className="text-center">{error}</p>
              <button onClick={fetchExplanation} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
          {explanation && (
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
          )}
        </div>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainFolderModal;
