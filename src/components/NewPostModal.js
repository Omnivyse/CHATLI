import React, { useState, useRef } from 'react';
import { X as XIcon, Image as ImageIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import CustomVideoPlayer from './CustomVideoPlayer';

const NewPostModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [creating, setCreating] = useState(false);
  const textareaRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = [];
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newMedia.push({
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: reader.result
        });
        loaded++;
        if (loaded === files.length) {
          setMedia(prev => [...prev, ...newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (idx) => {
    setMedia(media.filter((_, i) => i !== idx));
    if (currentMedia >= media.length - 1 && currentMedia > 0) setCurrentMedia(currentMedia - 1);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setCreating(true);
    try {
      const res = await api.createPost({ content, media });
      if (res.success) {
        setContent('');
        setMedia([]);
        setCurrentMedia(0);
        onPostCreated && onPostCreated();
        onClose();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted">
          <XIcon className="w-5 h-5" />
        </button>
        <h2 className="text-center text-lg font-semibold mb-4">Шинэ пост</h2>
        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
          <textarea
            ref={textareaRef}
            className="w-full p-3 rounded-xl border border-border bg-muted focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition placeholder:text-secondary text-base resize-none min-h-[60px]"
            placeholder="Юу бодож байна?"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            autoFocus
          />
          {media.length > 0 && (
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full flex items-center justify-center">
                {media.length > 1 && (
                  <button type="button" onClick={() => setCurrentMedia((currentMedia - 1 + media.length) % media.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {media[currentMedia].type === 'image' ? (
                  <img src={media[currentMedia].url} alt="post" className="max-h-48 rounded-xl object-contain border border-border" />
                ) : (
                  <CustomVideoPlayer src={media[currentMedia].url} className="max-h-48 rounded-xl object-contain border border-border" muted={true} />
                )}
                {media.length > 1 && (
                  <button type="button" onClick={() => setCurrentMedia((currentMedia + 1) % media.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-10">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(currentMedia)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 z-10"
                  title="Файл устгах"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              {media.length > 1 && (
                <div className="flex gap-1 mt-2 justify-center">
                  {media.map((_, idx) => (
                    <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === currentMedia ? 'bg-primary' : 'bg-muted'}`}></span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 justify-between">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition border border-border">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span className="text-sm text-secondary">Файл оруулах</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
            </label>
            <button
              type="submit"
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-primary text-primary-dark rounded-full font-semibold hover:bg-primary/90 transition disabled:opacity-50"
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