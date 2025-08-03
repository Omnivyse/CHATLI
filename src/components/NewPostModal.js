import React, { useState, useRef, useEffect } from 'react';
import { X as XIcon, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../utils/themeUtils';
import api from '../services/api';

const NewPostModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('media', file);
        
        const response = await api.uploadMedia(formData);
        return response.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setMedia(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading media:', error);
    }
  };

  const handleRemoveMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!content.trim() && media.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: content.trim(),
        media: media
      };

      const response = await api.createPost(postData);
      
      if (response.success) {
        setContent('');
        setMedia([]);
        onClose();
        if (onPostCreated) {
          onPostCreated(response.post);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9997] backdrop-blur-sm">
      <div className="bg-background dark:bg-background-dark rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-border dark:border-border-dark" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted dark:hover:bg-muted-dark z-50">
          <XIcon className="w-5 h-5 text-foreground dark:text-foreground-dark" />
        </button>
        <h2 className="text-center text-lg font-semibold mb-4 text-foreground dark:text-foreground-dark">Шинэ пост</h2>
        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
          <textarea
            ref={textareaRef}
            className="w-full p-3 rounded-xl border border-border dark:border-border-dark bg-muted dark:bg-muted-dark focus:bg-white dark:focus:bg-background-dark focus:border-primary dark:focus:border-primary-dark focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-dark/20 transition placeholder:text-secondary dark:placeholder:text-secondary-dark text-base resize-none min-h-[60px] text-foreground dark:text-foreground-dark"
            placeholder="Юу бодож байна?"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            autoFocus
          />
          
          {/* Media Preview */}
          {media.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {media.map((item, index) => (
                  <div key={index} className="relative">
                    <img
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePost}
              disabled={isSubmitting || (!content.trim() && media.length === 0)}
              className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal; 