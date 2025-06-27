import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Loader2,
  Moon,
  Sun,
  User,
  Mail,
  Globe
} from 'lucide-react';
import api from '../services/api';

const ProfileSettings = ({ user, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    coverImage: user.coverImage || ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: reader.result // base64 string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          coverImage: reader.result // base64 string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.updateProfile(formData);
      if (response.success) {
        setSuccess('Профайл амжилттай шинэчлэгдлээ');
        onUpdate(response.data.user);
        setIsEditing(false);
      }
    } catch (error) {
      setError(error.message || 'Профайл шинэчлэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      coverImage: user.coverImage || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Cover Image Section */}
        <div className="relative h-32 w-full bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
          {formData.coverImage || user.coverImage ? (
            <img
              src={formData.coverImage || user.coverImage}
              alt="Cover"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary text-lg bg-muted">Ковер зураг</div>
          )}
          {isEditing && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-2 bg-primary text-primary-dark rounded-full hover:bg-primary/90 transition-colors shadow"
              title="Ковер зураг солих"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageUpload}
            className="hidden"
          />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Профайл тохиргоо</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              {(formData.avatar || user.avatar) ? (
                <img 
                  src={formData.avatar || user.avatar} 
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                  <User className="w-12 h-12 text-secondary" />
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-dark rounded-full hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Нэр
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  placeholder="Нэрээ оруулна уу"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Имэйл
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg opacity-50 cursor-not-allowed"
                  placeholder="Имэйл"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Био
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-secondary" />
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 resize-none"
                  placeholder="Өөрийнхөө тухай бичнэ үү..."
                />
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-500 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-dark rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Цуцлах
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-dark rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Засах
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 