import React, { useState } from 'react';
import { X as XIcon, User as UserIcon, Loader2 } from 'lucide-react';
import api from '../services/api';
import UserProfileModal from './UserProfileModal';
import ReactDOM from 'react-dom';

const UserSearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.searchUsers(query);
      if (res.success) {
        setResults(res.data.users);
      } else {
        setError(res.message || 'Серверийн алдаа');
        setResults([]);
      }
    } catch (err) {
      setError('Серверийн алдаа. Дахин оролдоно уу.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full p-6 relative text-black z-[10000]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted">
          <XIcon className="w-5 h-5" />
        </button>
        <h2 className="text-center text-lg font-semibold mb-4">Хэрэглэгч хайх</h2>
        <div className="text-center text-secondary text-sm mb-4">Та нэр эсвэл хэрэглэгчийн нэрээр хайх боломжтой.</div>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Нэр эсвэл хэрэглэгчийн нэрээр хайх..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-dark rounded-lg font-semibold hover:bg-primary/90 transition">Хайх</button>
        </form>
        {error && (
          <div className="text-xs text-red-500 mb-2">{error}</div>
        )}
        {loading ? (
          <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : results.length === 0 && query ? (
          <div className="text-center text-secondary py-6">Хэрэглэгч олдсонгүй</div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map(u => (
              <div key={u._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => setSelectedUser(u)}>
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-secondary" />
                  </div>
                )}
                <span className="font-medium">{u.name}</span>
                <span className="text-secondary text-xs">@{u.username}</span>
                {u.privateProfile && <span className="ml-2 text-xs text-primary">Хувийн</span>}
              </div>
            ))}
          </div>
        )}
        {selectedUser && (
          <UserProfileModal userId={selectedUser._id} currentUser={selectedUser} onClose={() => setSelectedUser(null)} show={true} />
        )}
      </div>
    </div>,
    document.body
  );
};

export default UserSearchModal; 