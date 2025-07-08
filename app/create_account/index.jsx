import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, ActivityIndicator, StyleSheet, Dimensions, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import userService from '../../services/usersService';
import Navbar from '../../components/Navbar';

const { width: screenWidth } = Dimensions.get('window');

export default function CreateAccountScreen() {
  const [form, setForm] = useState({
    name: '',
    role: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    profilePicture: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Username validation states
  const [usernameValidation, setUsernameValidation] = useState({
    isChecking: false,
    isValid: null,
    message: ''
  });

  const [editUsernameValidation, setEditUsernameValidation] = useState({
    isChecking: false,
    isValid: null,
    message: ''
  });

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          user.status.toLowerCase().includes(query)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    const response = await userService.getUsers();
    setLoading(false);
    if (response.error) {
      setError(response.error);
    } else {
      setUsers(response.data);
      setFilteredUsers(response.data); // Initialize filtered users
    }
  };

  // Live username validation for create form
  const validateUsername = async (username, isEdit = false) => {
    if (!username || username.length < 3) {
      const validation = {
        isChecking: false,
        isValid: username.length === 0 ? null : false,
        message: username.length === 0 ? '' : 'Username must be at least 3 characters long'
      };
      
      if (isEdit) {
        setEditUsernameValidation(validation);
      } else {
        setUsernameValidation(validation);
      }
      return;
    }

    const validation = {
      isChecking: true,
      isValid: null,
      message: 'Checking username availability...'
    };
    
    if (isEdit) {
      setEditUsernameValidation(validation);
    } else {
      setUsernameValidation(validation);
    }

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if username exists (case-insensitive)
    const isDuplicate = users.some(user => {
      // For edit mode, exclude the current user being edited
      if (isEdit && editIndex !== null && user.$id === users[editIndex].$id) {
        return false;
      }
      return user.username.toLowerCase() === username.toLowerCase();
    });

    const finalValidation = {
      isChecking: false,
      isValid: !isDuplicate,
      message: isDuplicate ? 'Username already exists' : 'Username is available'
    };

    if (isEdit) {
      setEditUsernameValidation(finalValidation);
    } else {
      setUsernameValidation(finalValidation);
    }
  };

  // Debounced username validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.username) {
        validateUsername(form.username, false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [form.username, users]);

  // Debounced username validation for edit form
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editForm.username) {
        validateUsername(editForm.username, true);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [editForm.username, users, editIndex]);

  const handlePickImage = async (isEdit = false) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.cancelled) {
      if (isEdit) {
        setEditForm({ ...editForm, profilePicture: result.assets[0].base64 });
      } else {
        setForm({ ...form, profilePicture: result.assets[0].base64 });
      }
    }
  };

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Add user with enhanced validation
  const handleCreateAccount = async () => {
    if (!form.name || !form.role || !form.email || !form.username || !form.password || !form.confirmPassword) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    if (!isValidEmail(form.email)) {
      Alert.alert('Validation', 'Invalid email address.');
      return;
    }

    // Check username validation status
    if (usernameValidation.isChecking) {
      Alert.alert('Validation', 'Please wait while we check username availability.');
      return;
    }

    if (!usernameValidation.isValid) {
      Alert.alert('Validation', 'Please choose a different username.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    if (form.profilePicture && form.profilePicture.length > 65536) {
      Alert.alert('Image too large', 'Please select a smaller image.');
      return;
    }
    setLoading(true);
    const response = await userService.addUser({
      name: form.name,
      role: form.role,
      email: form.email,
      username: form.username,
      password: form.password,
      profile_picture: form.profilePicture,
      status: 'Active',
    });
    setLoading(false);
    if (response.error) {
      Alert.alert('Error', response.error);
      return;
    }
    fetchUsers();
    setForm({ name: '', role: '', email: '', username: '', password: '', confirmPassword: '', profilePicture: null });
    setUsernameValidation({ isChecking: false, isValid: null, message: '' });
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setEditForm({
      ...users[index],
      profilePicture: users[index].profile_picture || null,
    });
    setModalVisible(true);
    // Reset edit username validation
    setEditUsernameValidation({ isChecking: false, isValid: null, message: '' });
  };

  // Update user with enhanced validation
  const handleUpdateUser = async () => {
    if (!editForm.name || !editForm.role || !editForm.email) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }

    // Check username validation status if username was changed
    if (editForm.username && editForm.username !== users[editIndex].username) {
      if (editUsernameValidation.isChecking) {
        Alert.alert('Validation', 'Please wait while we check username availability.');
        return;
      }

      if (!editUsernameValidation.isValid) {
        Alert.alert('Validation', 'Please choose a different username.');
        return;
      }
    }

    if (editForm.profilePicture && editForm.profilePicture.length > 65536) {
      Alert.alert('Image too large', 'Please select a smaller image.');
      return;
    }
    setLoading(true);
    const response = await userService.updateUser(editForm.$id, {
      name: editForm.name,
      role: editForm.role,
      email: editForm.email,
      username: editForm.username,
      profile_picture: editForm.profilePicture,
      status: editForm.status,
    });
    setLoading(false);
    if (response.error) {
      Alert.alert('Error', response.error);
      return;
    }
    setModalVisible(false);
    fetchUsers();
    setEditUsernameValidation({ isChecking: false, isValid: null, message: '' });
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          const response = await userService.deleteUser(userId);
          setLoading(false);
          if (response.error) {
            Alert.alert('Error', response.error);
            return;
          }
          fetchUsers();
        }
      }
    ]);
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    setLoading(true);
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const response = await userService.updateUser(user.$id, { status: newStatus });
    setLoading(false);
    if (response.error) {
      Alert.alert('Error', response.error);
      return;
    }
    fetchUsers();
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Username validation indicator component
  const UsernameValidationIndicator = ({ validation }) => {
    if (!validation.message) return null;

    return (
      <View style={styles.validationContainer}>
        {validation.isChecking && <ActivityIndicator size="small" color="#007bff" />}
        <Text style={[
          styles.validationText,
          { color: validation.isValid === true ? '#28a745' : validation.isValid === false ? '#dc3545' : '#6c757d' }
        ]}>
          {validation.message}
        </Text>
      </View>
    );
  };

  // Responsive Table
  const ResponsiveTable = ({ data }) => (
    <ScrollView horizontal style={styles.tableScrollView}>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
          <Text style={[styles.headerCell, styles.usernameColumn]}>Username</Text>
          <Text style={[styles.headerCell, styles.emailColumn]}>Email</Text>
          <Text style={[styles.headerCell, styles.roleColumn]}>Role</Text>
          <Text style={[styles.headerCell, styles.statusColumn]}>Status</Text>
          <Text style={[styles.headerCell, styles.actionsColumn]}>Actions</Text>
        </View>
        {data.map((item, idx) => (
          <View key={item.$id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.nameColumn]}>{item.name}</Text>
            <Text style={[styles.cell, styles.usernameColumn]}>{item.username}</Text>
            <Text style={[styles.cell, styles.emailColumn]}>{item.email}</Text>
            <Text style={[styles.cell, styles.roleColumn]}>{item.role}</Text>
            <View style={[styles.cell, styles.statusColumn]}>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#28a745' : '#dc3545' }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={[styles.cell, styles.actionsColumn]}>
              <TouchableOpacity style={styles.updateButton} onPress={() => openEditModal(idx)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <Switch
                value={item.status === 'Active'}
                onValueChange={() => handleToggleStatus(item)}
                thumbColor={item.status === 'Active' ? '#28a745' : '#dc3545'}
                trackColor={{ false: '#ccc', true: '#28a745' }}
              />
              <TouchableOpacity style={styles.deactivateButton} onPress={() => handleDeleteUser(item.$id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView>
        <Text style={styles.sectionTitle}>Create Account</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChangeText={text => setForm({ ...form, name: text })}
          />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.role}
              style={styles.picker}
              onValueChange={itemValue => setForm({ ...form, role: itemValue })}
            >
              <Picker.Item label="Select Role" value="" />
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="Invest" value="invest" />
            </Picker>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={text => setForm({ ...form, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: usernameValidation.isValid === false ? '#dc3545' : 
                              usernameValidation.isValid === true ? '#28a745' : '#ccc'
                }
              ]}
              placeholder="Username"
              value={form.username}
              onChangeText={text => {
                setForm({ ...form, username: text });
                if (!text) {
                  setUsernameValidation({ isChecking: false, isValid: null, message: '' });
                }
              }}
              autoCapitalize="none"
            />
            <UsernameValidationIndicator validation={usernameValidation} />
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={form.password}
              onChangeText={text => setForm({ ...form, password: text })}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Text>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChangeText={text => setForm({ ...form, confirmPassword: text })}
              secureTextEntry={!confirmVisible}
            />
            <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
              <Text>{confirmVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage(false)}>
            <Text style={styles.imagePickerText}>Pick Profile Picture</Text>
          </TouchableOpacity>
          {form.profilePicture ? (
            <Image
              source={{ uri: `data:image/png;base64,${form.profilePicture}` }}
              style={styles.previewImage}
            />
          ) : null}
          <TouchableOpacity style={styles.submitButton} onPress={handleCreateAccount} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Users</Text>
        <View style={styles.usersSection}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name, username, email, role, or status..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Search Results Info */}
          {searchQuery && (
            <View style={styles.searchResults}>
              <Text style={styles.searchResultsText}>
                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
                {searchQuery && ` matching "${searchQuery}"`}
              </Text>
            </View>
          )}
          
          {loading ? <ActivityIndicator /> : <ResponsiveTable data={filteredUsers} />}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Edit User</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editForm.name || ''}
              onChangeText={text => setEditForm({ ...editForm, name: text })}
            />
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editForm.role || ''}
                style={styles.picker}
                onValueChange={itemValue => setEditForm({ ...editForm, role: itemValue })}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Invest" value="invest" />
              </Picker>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editForm.email || ''}
              onChangeText={text => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: editUsernameValidation.isValid === false ? '#dc3545' : 
                                editUsernameValidation.isValid === true ? '#28a745' : '#ccc'
                  }
                ]}
                placeholder="Username"
                value={editForm.username || ''}
                onChangeText={text => {
                  setEditForm({ ...editForm, username: text });
                  if (!text) {
                    setEditUsernameValidation({ isChecking: false, isValid: null, message: '' });
                  }
                }}
                autoCapitalize="none"
              />
              <UsernameValidationIndicator validation={editUsernameValidation} />
            </View>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage(true)}>
              <Text style={styles.imagePickerText}>Pick Profile Picture</Text>
            </TouchableOpacity>
            {editForm.profilePicture ? (
              <Image
                source={{ uri: `data:image/png;base64,${editForm.profilePicture}` }}
                style={styles.previewImage}
              />
            ) : null}
            <TouchableOpacity style={styles.submitButton} onPress={handleUpdateUser} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Update User</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 10, color: '#002D72' },
  form: { padding: 16, backgroundColor: '#fff', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 6, padding: 10, borderRadius: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, marginVertical: 6 },
  passwordInput: { flex: 1, paddingVertical: 10 },
  imagePicker: { backgroundColor: '#ccc', padding: 10, borderRadius: 4, marginTop: 10, alignItems: 'center' },
  imagePickerText: { fontWeight: 'bold' },
  previewImage: { height: 80, width: 80, borderRadius: 40, marginTop: 10, alignSelf: 'center' },
  submitButton: { backgroundColor: '#0056b3', padding: 12, borderRadius: 4, marginTop: 16 },
  submitButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  usersSection: { padding: 16, backgroundColor: '#fff' },
  tableScrollView: { flex: 1 },
  tableContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#dee2e6', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#bbb' },
  headerCell: { fontWeight: 'bold', textAlign: 'center', fontSize: 14, color: '#002D72' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e0e0e0', paddingVertical: 12, minHeight: 60 },
  cell: { textAlign: 'center', fontSize: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  nameColumn: { width: 150 },
  usernameColumn: { width: 120 },
  emailColumn: { width: 180 },
  roleColumn: { width: 100 },
  statusColumn: { width: 100 },
  actionsColumn: { width: 180, flexDirection: 'row', gap: 8, justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'center' },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  updateButton: { backgroundColor: '#007bff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  deactivateButton: { backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  buttonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, maxHeight: '80%' },
  cancelButton: { marginTop: 10, alignSelf: 'center', padding: 10 },
  cancelButtonText: { color: 'red', fontWeight: 'bold' },
  validationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4, 
    marginBottom: 6,
    paddingHorizontal: 4
  },
  validationText: { 
    fontSize: 12, 
    marginLeft: 8,
    fontWeight: '500'
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResults: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});