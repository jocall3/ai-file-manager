import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AIActionRequest } from '../../types';
import { readFileContent } from '../../services/fileSystemService';
import { performContextualAction } from '../../services/geminiService';
import Icon from '../ui/Icon';

interface AIActionModalProps {
  request: AIActionRequest;
  onClose: () => void;
}

const getTitleForAction = (action: AIActionRequest['action']) => {
    switch (action) {
        case 'summarize':
            return 'AI Summary';
        case 'explain_code':
            return 'AI Code Explanation';
        default:
            return 'AI Result';
    }
}

const AIActionModal: React.FC<AIActionModalProps> = ({ request, onClose }) => {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!request) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const content = await readFileContent(request.file.handle as FileSystemFileHandle);
      const aiResult = await performContextualAction(request.action, content);
      setResult(aiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="summary" className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{getTitleForAction(request.action)} of <span className="font-mono">{request.file.name}</span></h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <Icon name="loader" className="animate-spin text-blue-500 mb-4" size={48} />
              <p className="text-lg">Asking Gemini...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <Icon name="warning" className="mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Could not get result</h3>
              <p className="text-center">{error}</p>
              <button onClick={fetchResult} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
          {result && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
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

export default AIActionModal;
