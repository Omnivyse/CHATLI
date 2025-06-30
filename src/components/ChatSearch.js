import React, { useState, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';

const ChatSearch = ({ chatId, onClose, onMessageSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setCurrentIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchMessages(chatId, searchQuery);
      if (response.success) {
        setResults(response.data.messages);
        setCurrentIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (message) => {
    if (onMessageSelect) {
      onMessageSelect(message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        const index = currentIndex >= 0 ? currentIndex : 0;
        handleResultClick(results[index]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-background dark:bg-background-dark z-50 flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border dark:border-border-dark">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Мессеж хайх..."
            className="w-full pl-10 pr-4 py-2 bg-muted dark:bg-muted-dark rounded-lg border border-border dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted-dark transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-secondary">Хайж байна...</div>
          </div>
        ) : results.length === 0 && query ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-secondary">
              <p>Мессеж олдсонгүй</p>
              <p className="text-sm">"{query}" гэсэн мессеж байхгүй байна</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {results.map((message, index) => (
              <div
                key={message._id}
                onClick={() => handleResultClick(message)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentIndex 
                    ? 'bg-primary text-primary-dark' 
                    : 'hover:bg-muted dark:hover:bg-muted-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={message.sender.avatar}
                    alt={message.sender.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="font-medium text-sm">{message.sender.name}</span>
                  <span className="text-xs text-secondary">
                    {new Date(message.createdAt).toLocaleDateString('mn-MN')}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{message.content.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Info */}
      {results.length > 0 && (
        <div className="p-4 border-t border-border dark:border-border-dark bg-muted dark:bg-muted-dark">
          <div className="flex items-center justify-between text-sm text-secondary">
            <span>{results.length} мессеж олдлоо</span>
            <div className="flex items-center gap-2">
              <span>Навигаци:</span>
              <ChevronUp className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
              <span>Enter</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSearch; 