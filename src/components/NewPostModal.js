import React, { useState, useRef } from 'react';
import { X as XIcon, Image as ImageIcon, Plus } from 'lucide-react';
import api from '../services/api';
import CustomVideoPlayer from './CustomVideoPlayer';

const NewPostModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState('');
  const [fileType, setFileType] = useState('');
  const [creating, setCreating] = useState(false);
  const textareaRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result);
        setFileType(file.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setCreating(true);
    try {
      const res = await api.createPost({ content, image: fileType === 'image' ? file : '', video: fileType === 'video' ? file : '' });
      if (res.success) {
        setContent('');
        setFile('');
        setFileType('');
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
          {file && (
            <div className="relative w-fit">
              {fileType === 'image' ? (
                <img src={file} alt="post" className="max-h-48 rounded-xl object-contain border border-border" />
              ) : fileType === 'video' ? (
                <CustomVideoPlayer 
                  src={file} 
                  className="max-h-48 rounded-xl object-contain border border-border" 
                  muted={true}
                />
              ) : null}
              <button
                type="button"
                onClick={() => { setFile(''); setFileType(''); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                title="Файл устгах"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 justify-between">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition border border-border">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span className="text-sm text-secondary">Файл оруулах</span>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
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