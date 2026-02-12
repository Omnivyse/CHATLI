import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X as XIcon, Loader2, Shield, MessageCircle, Clock } from 'lucide-react';

const PrivacySettingsModal = ({ isOpen, onClose, user }) => {
  const [privacySettings, setPrivacySettings] = useState({
    isPrivateAccount: false,
    showProfileInSearch: true,
    allowMessagesFromStrangers: true,
    showOnlineStatus: true,
    showLastSeen: true,
    allowProfileViews: true,
    allowPostComments: true,
    allowEventInvites: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrivacySettings();
    }
  }, [isOpen]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const response = await api.getPrivacySettings();
      if (response.success && response.data) {
        const loadedSettings = {
          isPrivateAccount: false,
          showProfileInSearch: true,
          allowMessagesFromStrangers: true,
          showOnlineStatus: true,
          showLastSeen: true,
          allowProfileViews: true,
          allowPostComments: true,
          allowEventInvites: true,
          ...response.data
        };
        setPrivacySettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (settingKey, value) => {
    try {
      setSaving(true);
      const previousSettings = { ...privacySettings };
      const newSettings = { ...privacySettings, [settingKey]: value };
      setPrivacySettings(newSettings);

      const response = await api.updatePrivacySettings({ [settingKey]: value });
      
      if (!response.success) {
        setPrivacySettings(previousSettings);
        alert('Тохиргоо хадгалахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      alert('Тохиргоо хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const privacySections = [
    {
      title: 'Профайлын нууцлал',
      icon: Shield,
      items: [
        {
          key: 'isPrivateAccount',
          title: 'Хувийн профайл',
          description: 'Зөвхөн дагасан хүмүүс таны постуудыг харах боломжтой',
          value: privacySettings.isPrivateAccount,
        },
        {
          key: 'showProfileInSearch',
          title: 'Хайлтад харагдах',
          description: 'Бусад хэрэглэгчид таныг хайлтаас олж болно',
          value: privacySettings.showProfileInSearch,
        },
        {
          key: 'allowProfileViews',
          title: 'Профайл харагдах',
          description: 'Бусад хэрэглэгчид таны профайлыг харах боломжтой',
          value: privacySettings.allowProfileViews,
        },
      ],
    },
    {
      title: 'Холбоо ба харилцаа',
      icon: MessageCircle,
      items: [
        {
          key: 'allowMessagesFromStrangers',
          title: 'Гадны хүмүүсээс мессеж',
          description: 'Дагаагүй хүмүүс танд мессеж илгээх боломжтой',
          value: privacySettings.allowMessagesFromStrangers,
        },
        {
          key: 'allowPostComments',
          title: 'Пост дээр сэтгэгдэл',
          description: 'Бусад хэрэглэгчид таны постууд дээр сэтгэгдэл бичих боломжтой',
          value: privacySettings.allowPostComments,
        },
        {
          key: 'allowEventInvites',
          title: 'Event урилга',
          description: 'Бусад хэрэглэгчид танд event урих боломжтой',
          value: privacySettings.allowEventInvites,
        },
      ],
    },
    {
      title: 'Онлайн статус',
      icon: Clock,
      items: [
        {
          key: 'showOnlineStatus',
          title: 'Онлайн статус',
          description: 'Бусад хэрэглэгчид таны онлайн статусыг харах боломжтой',
          value: privacySettings.showOnlineStatus,
        },
        {
          key: 'showLastSeen',
          title: 'Сүүлд харагдах',
          description: 'Бусад хэрэглэгчид таны сүүлд харагдах хугацааг харах боломжтой',
          value: privacySettings.showLastSeen,
        },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Нууцлалын тохиргоо
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Тохиргоо уншиж байна...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {privacySections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </div>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.description}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting(item.key, !item.value)}
                          disabled={saving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsModal; 