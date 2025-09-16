import React, { useState } from 'react';
import Icon from './Icon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  onClear: () => void;
  isResults: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isSearching, onClear, isResults }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form onSubmit={handleSearch} className="relative w-64">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {isSearching ? (
          <Icon name="loader" size={18} className="text-gray-400 animate-spin" />
        ) : (
          <Icon name="search" size={18} className="text-gray-400" />
        )}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-lg border-none bg-gray-100 dark:bg-gray-700 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        placeholder="Semantic search..."
        disabled={isSearching}
      />
      {isResults && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Clear search results"
          title="Clear search results"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </form>
  );
};

export default SearchBar;
