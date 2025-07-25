import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Navbar from '../../components/Navbar';
import userService from '../../services/usersService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getLoggedInUsername = async () => {
  try {
    const username = await AsyncStorage.getItem('username');
    return username;
  } catch (e) {
    return null;
  }
};

export default function ViewProfileScreen() {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      const username = await getLoggedInUsername();
      const res = await userService.getUserByUsername(username);
      if (res && res.data) {
        setUser(res.data);
        setEditForm(res.data);
      } else {
        setError(res?.error || 'User not found');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    // Check if username is available before saving
    if (editForm.username !== user.username) {
      const isUsernameAvailable = await checkUsernameAvailability(editForm.username);
      if (!isUsernameAvailable) {
        return;
      }
    }

    setSaving(true);
    setError('');
    // Remove system fields and empty values before updating
    const { $id, $databaseId, $collectionId, $createdAt, $updatedAt, ...dataToUpdate } = editForm;
    
    // Remove empty or whitespace-only values
    const cleanedData = Object.entries(dataToUpdate).reduce((acc, [key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        acc[key] = value.trim();
      } else if (value && typeof value !== 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const res = await userService.updateUser(user.$id, cleanedData);
    if (!res.error) {
      setUser(res.data);
      setModalVisible(false);
      setUsernameError('');
    } else {
      setError(res.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon && <MaterialIcons name={icon} size={20} color="#6B7280" style={styles.infoIcon} />}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );

  const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username === user.username) {
      setUsernameError('');
      return true;
    }

    setCheckingUsername(true);
    try {
      // Add a small delay to prevent excessive API calls while typing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const res = await userService.getUserByUsername(username);
      if (res && res.data) {
        setUsernameError('Username is already taken');
        return false;
      } else {
        setUsernameError('');
        return true;
      }
    } catch (error) {
      // If user not found, username is available
      setUsernameError('');
      return true;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text) => {
    setEditForm({ ...editForm, username: text });
    if (text && text !== user.username) {
      checkUsernameAvailability(text);
    } else {
      setUsernameError('');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <ActivityIndicator size="large" color="#002D72" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <Navbar />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Profile</Text>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
          <Text style={styles.userRole}>{capitalizeFirstLetter(user.role)}</Text>
        </View>

        {/* Profile Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => {
                setEditForm(user);
                setModalVisible(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <InfoRow label="Full Name" value={user.name} icon="person" />
            <InfoRow label="Email Address" value={user.email} icon="email" />
            <InfoRow label="Username" value={user.username} icon="account-circle" />
            <InfoRow label="Role" value={capitalizeFirstLetter(user.role)} icon="work" />
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditForm(user);
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={18} color="white" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Modal with explicit boolean props */}
      <Modal 
        visible={modalVisible} 
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setUsernameError('');
                  setError('');
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={editForm.name || ''}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={editForm.email || ''}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.usernameContainer}>
                  <TextInput
                    style={[styles.input, usernameError ? styles.inputError : null]}
                    placeholder="Enter your username"
                    value={editForm.username || ''}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                  {checkingUsername && (
                    <View style={styles.usernameLoader}>
                      <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                  )}
                </View>
                {usernameError ? (
                  <View style={styles.fieldError}>
                    <MaterialIcons name="error" size={14} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{usernameError}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password (optional)"
                    value={editForm.password || ''}
                    onChangeText={(text) => setEditForm({ ...editForm, password: text })}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              {error ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error" size={16} color="#EF4444" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setUsernameError('');
                  setError('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  (saving || !!usernameError || checkingUsername) && styles.saveButtonDisabled
                ]} 
                onPress={handleUpdateProfile} 
                disabled={saving || !!usernameError || checkingUsername}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#002D72',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Card Styles
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  editIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  infoContainer: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002D72',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  usernameContainer: {
    position: 'relative',
  },
  usernameLoader: {
    position: 'absolute',
    right: 16,
    top: 17,
  },
  fieldError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});