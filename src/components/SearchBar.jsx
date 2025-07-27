import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

export function SearchBar({ searchTerm, setSearchTerm, onSearch, onRefresh }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex w-full gap-2">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="ابحث عن شخص..."
        />
      </div>
      
      <button
        onClick={onSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        بحث
      </button>
      
      <button
        onClick={onRefresh}
        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
      >
        <RefreshCw size={18} />
        تحديث
      </button>
    </div>
  );
}