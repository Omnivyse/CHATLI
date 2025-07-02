import React, { useState, useRef } from 'react';
import { X as XIcon, Image as ImageIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import CustomVideoPlayer from './CustomVideoPlayer';

const NewPostModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file sizes and types
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit (Cloudinary can handle larger files)
        setError(`${file.name} файлын хэмжээ 50MB-аас бага байх ёстой`);
        return;
      }
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError(`${file.name} файлын төрөл зөвхөн зураг эсвэл видео байх ёстой`);
        return;
      }
    }

    setError('');
    setCreating(true); // Show loading state while uploading

    try {
      const response = await api.uploadFiles(files);
      
      if (response.success) {
        const newMedia = response.data.map(item => ({
          type: item.type,
          url: item.url,
          publicId: item.publicId,
          width: item.width,
          height: item.height,
          format: item.format,
          size: item.size
        }));
        
        setMedia(prev => [...prev, ...newMedia]);
        setError('');
      } else {
        setError(response.message || 'Файл байршуулахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError('Файл байршуулахад алдаа гарлаа');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveMedia = (idx) => {
    setMedia(media.filter((_, i) => i !== idx));
    if (currentMedia >= media.length - 1 && currentMedia > 0) {
      setCurrentMedia(currentMedia - 1);
    } else if (currentMedia >= media.length - 1) {
      setCurrentMedia(0);
    }
  };

  const handleMediaNavigation = (direction) => {
    if (media.length > 1) {
      if (direction === 'next') {
        setCurrentMedia((currentMedia + 1) % media.length);
      } else {
        setCurrentMedia((currentMedia - 1 + media.length) % media.length);
      }
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Постын агуулга хоосон байж болохгүй');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await api.createPost({ content, media });
      if (res.success) {
        setContent('');
        setMedia([]);
        setCurrentMedia(0);
        onPostCreated && onPostCreated();
        onClose();
      }
    } catch (error) {
      setError(error.message || 'Пост үүсгэхэд алдаа гарлаа');
    } finally {
      setCreating(false);
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
          
          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {media.length > 0 && (
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full flex items-center justify-center">
                {media.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleMediaNavigation('prev')} 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-20 hover:bg-black/60 transition-colors cursor-pointer touch-button carousel-nav-button"
                    title="Өмнөх зураг"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {media[currentMedia].type === 'image' ? (
                  <img 
                    src={media[currentMedia].url} 
                    alt="post" 
                    className="max-h-64 w-auto mx-auto rounded-xl object-contain border border-border dark:border-border-dark" 
                    style={{ maxWidth: '100%' }}
                  />
                ) : (
                  <CustomVideoPlayer 
                    src={media[currentMedia].url} 
                    className="rounded-xl border border-border dark:border-border-dark" 
                    muted={true} 
                    inModal={true}
                    minimalControls={true}
                  />
                )}
                {media.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleMediaNavigation('next')} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-20 hover:bg-black/60 transition-colors cursor-pointer touch-button carousel-nav-button"
                    title="Дараагийн зураг"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(currentMedia)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 z-20 transition-colors cursor-pointer touch-button"
                  title="Файл устгах"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              {media.length > 1 && (
                <div className="flex gap-1 mt-2 justify-center">
                  {media.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentMedia(idx)}
                      className={`w-1 h-1 rounded-full cursor-pointer carousel-indicator ${idx === currentMedia ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-700'}`}
                      title={`${idx + 1} зураг`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 justify-between">
            <label className={`flex items-center gap-2 px-3 py-2 bg-muted dark:bg-muted-dark rounded-lg transition border border-border dark:border-border-dark touch-button ${creating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/80 dark:hover:bg-muted-dark/80'}`}>
              <ImageIcon className="w-5 h-5 text-primary dark:text-primary-dark" />
              <span className="text-sm text-secondary dark:text-secondary-dark">
                {creating ? 'Байршуулж байна...' : 'Файл оруулах'}
              </span>
              <input 
                type="file" 
                accept="image/*,video/*" 
                multiple 
                onChange={handleFileChange} 
                disabled={creating}
                className="hidden" 
              />
            </label>
            <button
              type="submit"
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-primary dark:bg-primary-dark text-primary-dark dark:text-primary rounded-full font-semibold hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition disabled:opacity-50 cursor-pointer touch-button"
              disabled={creating || !content.trim()}
            >
              {creating ? 'Үүсгэж байна...' : 'Постлох'}
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal; 