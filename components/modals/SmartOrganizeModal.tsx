// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { useState, useEffect, useCallback } from 'react';
import { suggestOrganization } from '../../services/geminiService';
import type { FileNode, OrganizationSuggestion } from '../../types';
import Icon from '../ui/Icon';
import loggingService from '../../services/loggingService';

interface SmartOrganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onApply: (suggestions: OrganizationSuggestion[]) => void;
}

const SmartOrganizeModal: React.FC<SmartOrganizeModalProps> = ({ isOpen, onClose, files, onApply }) => {
  const [suggestions, setSuggestions] = useState<OrganizationSuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    
    try {
      const fileNames = files.map(f => f.name);
      const result = await suggestOrganization(fileNames);
      setSuggestions(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      loggingService.error('SmartOrganizeModal', `Failed to fetch suggestions: ${errorMessage}`, e);
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, fetchSuggestions]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (suggestions) {
      onApply(suggestions);
      onClose();
    }
  };
  
  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icon name="sparkles" className="text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Smart Organize</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <Icon name="loader" className="animate-spin text-purple-500 mb-4" size={48} />
              <p className="text-lg">Asking Gemini for organizing suggestions...</p>
              <p className="text-sm">This may take a moment.</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <Icon name="warning" className="mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Could not get suggestions</h3>
              <p className="text-center">{error}</p>
              <button onClick={fetchSuggestions} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
          {suggestions && (
            <div>
              {!hasSuggestions && !isLoading ? (
                 <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                    <p>No organization suggestions for the current files.</p>
                </div>
              ) : (
                <>
                <p className="mb-4 text-gray-700 dark:text-gray-300">Gemini suggests organizing your files into the following folders:</p>
                <div className="space-y-4">
                  {suggestions.map(({ folderName, fileNames }) => (
                    <div key={folderName} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex items-center font-semibold text-gray-800 dark:text-white mb-2">
                        <Icon name="folder" className="mr-2 text-yellow-500" />
                        <span>{folderName}</span>
                      </div>
                      <ul className="pl-8 space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                        {fileNames.map(fileName => (
                          <li key={fileName}>{fileName}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasSuggestions || isLoading}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Icon name="check" size={18} />
            Apply Organization
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartOrganizeModal;