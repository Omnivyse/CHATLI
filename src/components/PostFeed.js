import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Post from './Post';
import { Search as SearchIcon } from 'lucide-react';
import NewPostModal from './NewPostModal';
import UserSearchModal from './UserSearchModal';

const PostFeed = ({ user, settingsModalOpen, onStartChat }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchPosts();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for custom event from bottom navigation
    const handleOpenPostModal = () => {
      setShowModal(true);
    };
    
    // Listen for custom event from header search button
    const handleOpenUserSearchModal = () => {
      setShowUserSearchModal(true);
    };
    
    window.addEventListener('openPostModal', handleOpenPostModal);
    window.addEventListener('openUserSearchModal', handleOpenUserSearchModal);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('openPostModal', handleOpenPostModal);
      window.removeEventListener('openUserSearchModal', handleOpenUserSearchModal);
    };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // If user is not verified, don't fetch posts to avoid auth errors
      if (user && !user.emailVerified) {
        console.log('⚠️ User not verified, skipping posts fetch');
        setPosts([]);
        setLoading(false);
        return;
      }

      const res = await api.getPosts();
      if (res.success) {
        setPosts(res.data.posts);
      } else {
        setError(res.message || 'Пост уншихад алдаа гарлаа');
      }
    } catch (e) {
      console.error('Fetch posts error:', e);
      if (e.message.includes('401')) {
        setError('Нэвтрэх шаардлагатай');
      } else if (e.message.includes('500')) {
        setError('Серверийн алдаа - дахин оролдоно уу');
      } else if (e.message.includes('Network')) {
        setError('Сүлжээний алдаа - холболтоо шалгана уу');
      } else {
        setError('Пост уншихад алдаа гарлаа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-2 sm:px-4 py-2 sm:py-4 pb-12 sm:pb-4 mobile-scroll-container">
      {/* Sticky New Post UI - Desktop Only */}
      {!isMobile && (
        <div className="sticky top-0 z-20 mb-6 bg-background dark:bg-background-dark/95 backdrop-blur-sm rounded-2xl shadow p-4 border border-border dark:border-border-dark">
          {/* Desktop Layout - Horizontal */}
          <div className="flex items-center gap-3">
            <input
              className="flex-1 bg-muted dark:bg-muted-dark rounded-full px-4 py-2 border border-border dark:border-border-dark focus:bg-white dark:focus:bg-background-dark focus:border-primary dark:focus:border-primary-dark focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-dark/20 transition placeholder:text-secondary dark:placeholder:text-secondary-dark text-base cursor-pointer"
              placeholder="Юу бодож байна?"
              onFocus={() => setShowModal(true)}
              readOnly
            />
            <button
              className="px-6 py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-full font-semibold hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition"
              onClick={() => setShowModal(true)}
            >
              Постлох
            </button>
            <button
              className="p-2 bg-muted dark:bg-muted-dark text-primary dark:text-primary-dark rounded-full hover:bg-primary/10 dark:hover:bg-primary-dark/10 transition flex items-center justify-center"
              title="Хэрэглэгч хайх"
              onClick={() => setShowUserSearchModal(true)}
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showUserSearchModal && (
        <UserSearchModal 
          onClose={() => setShowUserSearchModal(false)} 
          currentUser={user}
          onStartChat={onStartChat}
        />
      )}
      {showModal && (
        <NewPostModal user={user} onClose={() => setShowModal(false)} onPostCreated={fetchPosts} />
      )}
      
      {/* Posts Feed */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-primary dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-colors"
          >
            Дахин оролдох
          </button>
        </div>
      ) : user && !user.emailVerified ? (
        <div className="text-center py-8">
          <div className="text-secondary dark:text-secondary-dark mb-2">Имэйл хаягаа баталгаажуулна уу</div>
          <div className="text-sm text-secondary dark:text-secondary-dark">Постуудыг харахын тулд имэйл хаягаа баталгаажуулна уу</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-secondary dark:text-secondary-dark">Пост байхгүй байна</div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <Post 
              key={post._id} 
              post={post} 
              user={user} 
              onPostUpdate={fetchPosts} 
              settingsModalOpen={settingsModalOpen}
              onStartChat={onStartChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostFeed; 