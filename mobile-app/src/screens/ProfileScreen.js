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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Post from '../components/Post';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const ProfileScreen = ({ navigation, user, onLogout }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [profileImageViewerVisible, setProfileImageViewerVisible] = useState(false);
  const [coverImageViewerVisible, setCoverImageViewerVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Гарах',
      'Та гарахдаа итгэлтэй байна уу?',
      [
        {
          text: 'Болих',
          style: 'cancel',
        },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            onLogout();
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loadUserPosts = async () => {
      setPostsLoading(true);
      try {
        const response = await api.getUserPosts(user._id);
        if (response.success && response.data.posts) {
          setPosts(response.data.posts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    loadUserPosts();
  }, [user._id]);

  // Only menu items left: EditProfile and Settings are now header icons
  const menuItems = [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header with Settings (left) and EditProfile (right) */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerIconLeft}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Профайл</Text>
        <TouchableOpacity
          style={styles.headerIconRight}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {user.coverImage ? (
          <TouchableOpacity 
            style={styles.coverImageContainer}
            onPress={() => setCoverImageViewerVisible(true)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: user.coverImage }} style={styles.coverImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <TouchableOpacity 
                onPress={() => setProfileImageViewerVisible(true)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Image source={require('../../assets/logo.png')} style={styles.avatarLogo} resizeMode="contain" />
              </View>
            )}
          </View>
          
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.name && typeof user.name === 'string' ? user.name : 'Unknown User'}
            </Text>
            {user.isVerified && (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={colors.primary} 
                style={styles.verifiedIcon}
              />
            )}
          </View>
          
          <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
            @{user.username && typeof user.username === 'string' ? user.username : 'unknown'}
          </Text>
          
          {user.bio && (
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>
          {user.bio && typeof user.bio === 'string' ? user.bio : ''}
        </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user.following?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Дагаж байна</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user.followers?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Дагагч</Text>
            </View>
            <View style={styles.statItem}>
                              <Text style={[styles.statNumber, { color: colors.text }]}>{String(posts.length)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Пост</Text>
            </View>
          </View>
        </View>

        {/* Menu Items (now empty) */}
        {menuItems.length > 0 && (
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && { borderBottomWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={24} color="#666" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Posts Section */}
        <View style={[styles.postsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.postsSectionTitle, { color: colors.text }]}>Таны постууд</Text>
          {postsLoading ? (
            <View style={styles.postsLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.postsLoadingText, { color: colors.textSecondary }]}>Постууд ачаалж байна...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.noPostsTitle, { color: colors.text }]}>Пост алга</Text>
              <Text style={[styles.noPostsText, { color: colors.textSecondary }]}>Та одоогоор пост оруулаагүй байна.</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={item => item._id}
              renderItem={({ item }) => <Post post={item} user={user} navigation={navigation} />}
              contentContainerStyle={styles.postsList}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Profile Image Viewer Modal */}
      <Modal
        visible={profileImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileImageViewerVisible(false)}
      >
        <TouchableOpacity
          style={styles.profileImageModalOverlay}
          activeOpacity={1}
          onPress={() => setProfileImageViewerVisible(false)}
        >
          <TouchableOpacity
            style={styles.profileImageModalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping the image
          >
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.profileImageModalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.profileImageModalPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="person" size={80} color={colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.profileImageModalCloseButton}
              onPress={() => setProfileImageViewerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Cover Image Viewer Modal */}
      <Modal
        visible={coverImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCoverImageViewerVisible(false)}
      >
        <TouchableOpacity
          style={styles.coverImageModalOverlay}
          activeOpacity={1}
          onPress={() => setCoverImageViewerVisible(false)}
        >
          <TouchableOpacity
            style={styles.coverImageModalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping the image
          >
            {user.coverImage ? (
              <Image
                source={{ uri: user.coverImage }}
                style={styles.coverImageModalImage}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              style={styles.coverImageModalCloseButton}
              onPress={() => setCoverImageViewerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  headerIconLeft: {
    marginRight: 12,
  },
  headerIconRight: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    marginBottom: -50,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedIcon: {
    marginLeft: 8,
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
  menuSection: {
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
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
  profileImageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageModalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImageModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileImageModalPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageModalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  coverImageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageModalContent: {
    width: '95%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImageModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  coverImageModalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  verificationContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
});

export default ProfileScreen; 