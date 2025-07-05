import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Post from '../components/Post';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const UserProfileScreen = ({ navigation, route, user: currentUser }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { userId, userName } = route.params;
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.getUserProfile(userId);
      if (response.success) {
        setProfileUser(response.data.user);
        setIsFollowing(response.data.user.followers?.includes(currentUser._id) || false);
        loadUserPosts();
      } else {
        setError('Хэрэглэгчийн мэдээлэл олдсонгүй');
      }
    } catch (error) {
      console.error('Load user profile error:', error);
      setError('Хэрэглэгчийн мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setPostsLoading(true);
      
      // First try the specific user posts endpoint
      try {
        const response = await api.getUserPosts(userId);
        if (response.success && response.data.posts) {
          console.log(`Found ${response.data.posts.length} posts for user ${userId}`);
          setPosts(response.data.posts);
          return;
        }
      } catch (endpointError) {
        console.log('User posts endpoint not available, using fallback');
      }
      
      // Fallback: get all posts and filter by user ID
      const allPostsResponse = await api.getPosts();
      if (allPostsResponse.success && allPostsResponse.data.posts) {
        console.log(`Total posts in feed: ${allPostsResponse.data.posts.length}`);
        console.log(`Looking for posts by user: ${userId}`);
        
        const userPosts = allPostsResponse.data.posts.filter(post => {
          const isUserPost = post.author && post.author._id === userId;
          if (isUserPost) {
            console.log(`Found post by user: ${post._id} - ${post.content?.substring(0, 50)}...`);
          }
          return isUserPost;
        });
        
        console.log(`Filtered posts for user ${userId}: ${userPosts.length}`);
        setPosts(userPosts);
      } else {
        console.log('No posts found or API error');
        setPosts([]);
      }
    } catch (error) {
      console.error('Load user posts error:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      const response = isFollowing 
        ? await api.unfollowUser(userId)
        : await api.followUser(userId);
      
      if (response.success) {
        setIsFollowing(!isFollowing);
        // Update follower count
        setProfileUser(prev => ({
          ...prev,
          followers: isFollowing 
            ? prev.followers.filter(id => id !== currentUser._id)
            : [...(prev.followers || []), currentUser._id]
        }));
      } else {
        Alert.alert('Алдаа', response.message || 'Дагах/дагахаа болих үйлдэл амжилтгүй');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Алдаа', 'Дагах/дагахаа болих үйлдэл амжилтгүй');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      // Check if chat already exists
      const existingChats = await api.getChats();
      if (existingChats.success) {
        const existingChat = existingChats.data.chats.find(chat => 
          chat.type === 'direct' && 
          chat.participants.some(p => p._id === userId)
        );
        
        if (existingChat) {
          navigation.navigate('Chat', {
            chatId: existingChat._id,
            chatTitle: profileUser.name
          });
          return;
        }
      }

      // Create new chat
      const response = await api.createChat({
        type: 'direct',
        participants: [userId]
      });
      
      if (response.success) {
        navigation.navigate('Chat', {
          chatId: response.data.chat._id,
          chatTitle: profileUser.name
        });
      } else {
        Alert.alert('Алдаа', 'Чат үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      Alert.alert('Алдаа', 'Чат үүсгэхэд алдаа гарлаа');
    }
  };

  const handlePostUpdate = () => {
    loadUserPosts();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Хэрэглэгч</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Хэрэглэгчийн мэдээлэл ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Хэрэглэгч</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Алдаа гарлаа</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadUserProfile}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Хэрэглэгч</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Хэрэглэгч олдсонгүй</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Энэ хэрэглэгч байхгүй байна</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUser._id === userId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{profileUser.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {profileUser.coverImage && (
          <View style={styles.coverImageContainer}>
            <Image 
              source={{ uri: profileUser.coverImage }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            {profileUser.avatar ? (
              <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>{profileUser.name}</Text>
          <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{profileUser.username}</Text>
          
          {profileUser.bio && (
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>{profileUser.bio}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{profileUser.following?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Дагаж байна</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{profileUser.followers?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Дагагч</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Пост</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { backgroundColor: colors.primary },
                  isFollowing && { backgroundColor: colors.surfaceVariant }
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? colors.text : colors.textInverse} />
                ) : (
                  <>
                    <Ionicons 
                      name={isFollowing ? "checkmark" : "add"} 
                      size={16} 
                      color={isFollowing ? colors.text : colors.textInverse} 
                    />
                    <Text style={[
                      styles.followButtonText,
                      { color: colors.textInverse },
                      isFollowing && { color: colors.text }
                    ]}>
                      {isFollowing ? 'Дагасан' : 'Дагах'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={handleStartChat}
              >
                <Ionicons name="chatbubble" size={16} color={colors.text} />
                <Text style={[styles.messageButtonText, { color: colors.text }]}>Мессеж</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={[styles.postsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.postsSectionTitle, { color: colors.text }]}>Постууд</Text>
          
          {postsLoading ? (
            <View style={styles.postsLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.postsLoadingText, { color: colors.textSecondary }]}>Постууд ачаалж байна...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.noPostsTitle, { color: colors.text }]}>Пост байхгүй</Text>
              <Text style={[styles.noPostsText, { color: colors.textSecondary }]}>
                {isOwnProfile ? 'Та одоогоор пост нийтлээгүй байна' : 'Энэ хэрэглэгч одоогоор пост нийтлээгүй байна'}
              </Text>
            </View>
          ) : (
            <View style={styles.postsList}>
              {posts.map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  user={currentUser}
                  onPostUpdate={handlePostUpdate}
                  navigation={navigation}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginBottom: 16,
    marginTop: -50,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  unfollowButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  unfollowButtonText: {
    color: '#000',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  messageButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  postsSection: {
    paddingVertical: 20,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  postsLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  postsLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  noPostsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  noPostsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  postsList: {
    paddingHorizontal: 20,
  },
});

export default UserProfileScreen; 