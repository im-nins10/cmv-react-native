import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Navbar from '../../components/Navbar';
import userService from '../../services/usersService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    setSaving(true);
    setError('');
    // Remove system fields before updating
    const { $id, $databaseId, $collectionId, $createdAt, $updatedAt, ...dataToUpdate } = editForm;
    const res = await userService.updateUser(user.$id, dataToUpdate);
    if (!res.error) {
      setUser(res.data);
      setModalVisible(false);
    } else {
      setError(res.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#002D72" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Navbar />

      <View style={styles.profileContainer}>
        <Text style={styles.sectionTitle}>User Profile</Text>

        <View style={styles.card}>
         
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{user.name}</Text>

            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user.role}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{user.username}</Text>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: user.status === 'Active' ? '#28a745' : '#dc3545' },
                ]}
              >
                <Text style={styles.statusText}>{user.status}</Text>
              </View>
            </View>
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
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            />
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
            />

            {/* Removed role picker to prevent updating role */}
            {/* <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <Picker.Item label="Admin" value="Admin" />
                <Picker.Item label="Invest Team" value="Invest Team" />
              </Picker>
            </View> */}

            {/* Add password field */}
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={editForm.password || ''}
                onChangeText={(text) => setEditForm({ ...editForm, password: text })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 18,
                  zIndex: 1,
                }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            
            {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf0f6' },
  profileContainer: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#002D72', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#002D72',
  },
  infoContainer: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  statusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#002D72' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginVertical: 6,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: { marginTop: 10, alignItems: 'center' },
  cancelButtonText: { color: 'red', fontWeight: 'bold' },
});