import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Loader2,
  User,
  Mail,
  Globe,
  Trash2,
  AlertTriangle,
  Info,
  Shield,
  Copyright,
  Flag
} from 'lucide-react';
import api from '../services/api';

const ProfileSettings = ({ user, onClose, onUpdate, onShowWelcome, onShowPrivacy, onShowCopyright, onShowReport }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    avatarPublicId: user.avatarPublicId || '',
    coverImage: user.coverImage || '',
    coverImagePublicId: user.coverImagePublicId || ''
  });



  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setError('');
      
      try {
        const response = await api.uploadAvatar(file);
        
        if (response.success) {
          setFormData({
            ...formData,
            avatar: response.data.url,
            avatarPublicId: response.data.publicId
          });
        } else {
          setError(response.message || 'Зураг байршуулахад алдаа гарлаа');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        setError('Зураг байршуулахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setError('');
      
      try {
        const response = await api.uploadSingleFile(file);
        
        if (response.success) {
          setFormData({
            ...formData,
            coverImage: response.data.url,
            coverImagePublicId: response.data.publicId
          });
        } else {
          setError(response.message || 'Ковер зураг байршуулахад алдаа гарлаа');
        }
      } catch (error) {
        console.error('Cover image upload error:', error);
        setError('Ковер зураг байршуулахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
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

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setError('Нууц үгээ оруулна уу');
      return;
    }

    setDeleting(true);
    setError('');
    
    try {
      const response = await api.deleteAccount(deletePassword);
      if (response.success) {
        // Clear local storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Таны акаунт амжилттай устгагдлаа');
        window.location.href = '/'; // Redirect to login page
      } else {
        setError(response.message || 'Акаунт устгахад алдаа гарлаа');
      }
    } catch (error) {
      setError(error.message || 'Акаунт устгахад алдаа гарлаа');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  <img src="/img/logo.png" alt="CHATLI Logo" className="w-12 h-12 object-contain" />
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
              <label className="block text-sm font-medium text-white mb-2">
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
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 text-black placeholder:text-secondary"
                  placeholder="Нэрээ оруулна уу"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Имэйл
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg opacity-50 cursor-not-allowed text-black placeholder:text-secondary"
                  placeholder="Имэйл"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
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
                  className="w-full pl-10 pr-4 py-2 bg-white text-black border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 resize-none placeholder:text-secondary"
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
          <div className="flex gap-3 mt-6">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-dark dark:bg-white dark:text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-dark dark:bg-white dark:text-black rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Засах
              </button>
            )}
          </div>

          {/* Info and Legal Buttons */}
          {!isEditing && (
            <div className="mt-4 space-y-3">
              {/* App Info Button */}
              {onShowWelcome && (
                <button
                  onClick={() => {
                    onShowWelcome();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Апп-ийн мэдээлэл
                </button>
              )}

              {/* Legal and Report Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {onShowPrivacy && (
                  <button
                    onClick={() => {
                      onShowPrivacy();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Нууцлал
                  </button>
                )}

                {onShowCopyright && (
                  <button
                    onClick={() => {
                      onShowCopyright();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Copyright className="w-4 h-4" />
                    Эрх
                  </button>
                )}

                {onShowReport && (
                  <button
                    onClick={() => {
                      onShowReport();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Flag className="w-4 h-4" />
                    Мэдээлэх
                  </button>
                )}
              </div>
            </div>
          )}



          {/* Danger Zone */}
          <div className="border-t border-red-200 dark:border-red-800 pt-6 mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Аюултай бүс
              </h3>
              <p className="text-sm text-secondary dark:text-secondary-dark">
                Акаунт устгасан тохиолдолд бүх мэдээлэл бүрмөсөн устах болно.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Акаунт устгах
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-background dark:bg-background-dark rounded-lg shadow-xl max-w-md w-full p-6 border border-border dark:border-border-dark">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                    Акаунт устгах
                  </h3>
                  <p className="text-sm text-secondary dark:text-secondary-dark">
                    Энэ үйлдлийг буцаах боломжгүй
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-foreground dark:text-foreground-dark mb-4">
                  Та өөрийн акаунтыг устгахыг хүсэж байна. Энэ нь таны бүх пост, мессеж, зураг, видео болон бусад мэдээллийг бүрмөсөн устгах болно.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-medium">
                  Баталгаажуулахын тулд нууц үгээ оруулна уу:
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Нууц үг"
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="flex-1 py-2 px-4 bg-muted dark:bg-muted-dark text-foreground dark:text-foreground-dark rounded-lg hover:bg-muted/80 dark:hover:bg-muted-dark/80 transition-colors disabled:opacity-50"
                >
                  Цуцлах
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deletePassword.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? 'Устгаж байна...' : 'Акаунт устгах'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings; 