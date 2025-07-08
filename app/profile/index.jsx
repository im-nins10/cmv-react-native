import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Navbar from '../../components/Navbar'; // adjust the path if needed

export default function ViewProfileScreen() {
  const [user, setUser] = useState({
    name: 'Jane Doe',
    role: 'Admin',
    email: 'jane.doe@example.com',
    username: 'janedoe123',
    status: 'Active',
    profilePicture: 'https://i.pravatar.cc/150?img=12',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setEditForm({ ...editForm, profilePicture: result.assets[0].uri });
    }
  };

  const handleUpdateProfile = () => {
    setUser(editForm);
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Navbar />

      <View style={styles.profileContainer}>
        <Text style={styles.sectionTitle}>User Profile</Text>

        <View style={styles.card}>
          <Image
            source={{ uri: user.profilePicture }}
            style={styles.profileImage}
          />

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

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
            />

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <Picker.Item label="Admin" value="Admin" />
                <Picker.Item label="Invest Team" value="Invest Team" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              <Text style={styles.imagePickerText}>Change Picture</Text>
            </TouchableOpacity>

            {editForm.profilePicture && (
              <Image source={{ uri: editForm.profilePicture }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
              <Text style={styles.saveButtonText}>Save</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  imagePicker: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    alignItems: 'center',
  },
  imagePickerText: { fontWeight: 'bold' },
  previewImage: {
    height: 60,
    width: 60,
    borderRadius: 30,
    marginTop: 10,
    alignSelf: 'center',
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
