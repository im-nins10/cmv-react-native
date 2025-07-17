import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isLandscape = width > height;

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New state for forgot password modal visibility and email input
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const useHorizontalLayout = isTablet || (isLandscape && width > 600);

  const handleLogin = async () => {
    const response = await authService.login(username, password);
    if (response.error) {
      Alert.alert('Login Failed', response.error);
    } else {
      // Save username, role, and full name to AsyncStorage
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('role', response.user.role || '');
      await AsyncStorage.setItem('fullName', response.user.name || '');
      router.push('/landing');
    }
  };

  // Handler for sending forgot password email (placeholder)
  const handleSendForgotPassword = () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    // Placeholder: Implement actual forgot password logic here
    Alert.alert('Password Reset', `Password reset link sent to ${forgotEmail}`);
    setForgotPasswordVisible(false);
    setForgotEmail('');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, useHorizontalLayout ? styles.horizontalLayout : styles.verticalLayout]}>
        
        {/* Login Form Panel */}
        <View style={[styles.leftPanel, useHorizontalLayout ? styles.leftPanelHorizontal : styles.leftPanelVertical]}>
          <View style={[styles.wrapper, useHorizontalLayout ? styles.wrapperHorizontal : styles.wrapperVertical]}>
            
            <Text style={[styles.title, useHorizontalLayout ? styles.titleHorizontal : styles.titleVertical]}>
              Login
            </Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, useHorizontalLayout ? styles.inputHorizontal : styles.inputVertical]}
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <MaterialIcons name="person" size={18} color="#999" style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, useHorizontalLayout ? styles.inputHorizontal : styles.inputVertical]}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                  <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rememberForgot}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <MaterialIcons name="check" size={12} color="white" />}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleLogin}>
              <Text style={styles.btnText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo Panel */}
        <View style={[styles.rightPanel, useHorizontalLayout ? styles.rightPanelHorizontal : styles.rightPanelVertical]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={[styles.logo, useHorizontalLayout ? styles.logoHorizontal : styles.logoVertical]}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={forgotPasswordVisible}
        onRequestClose={() => setForgotPasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.modalBtn]} onPress={handleSendForgotPassword}>
                <Text style={styles.btnText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setForgotPasswordVisible(false);
                  setForgotEmail('');
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, minHeight: height },
  container: { flex: 1, minHeight: height },
  horizontalLayout: { flexDirection: 'row' },
  verticalLayout: { flexDirection: 'column' },

  leftPanel: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e2d44' },
  leftPanelHorizontal: { flex: 1, paddingHorizontal: 20 },
  leftPanelVertical: { flex: 2, paddingHorizontal: 20, paddingVertical: 40 },

  rightPanel: { backgroundColor: '#e6e6e6', justifyContent: 'center', alignItems: 'center' },
  rightPanelHorizontal: { flex: 1 },
  rightPanelVertical: { flex: 1, paddingVertical: 20 },

  wrapper: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 7.5,
    elevation: 5,
    width: '100%',
  },
  wrapperHorizontal: { padding: 30, maxWidth: 400 },
  wrapperVertical: { padding: 20, maxWidth: 350 },

  title: { fontWeight: 'bold', textAlign: 'center', color: 'black' },
  titleHorizontal: { fontSize: 24, marginBottom: 25 },
  titleVertical: { fontSize: 22, marginBottom: 20 },

  inputBox: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 5, color: '#333' },
  inputContainer: { position: 'relative' },
  input: {
    width: '100%',
    paddingRight: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: 'white',
  },
  inputHorizontal: { padding: 12 },
  inputVertical: { padding: 14 },
  inputIcon: { position: 'absolute', right: 15, top: 12 },

  rememberForgot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  rememberContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#226bff', borderColor: '#226bff' },
  rememberText: { fontSize: 14, color: '#333' },
  forgotText: { fontSize: 14, color: '#226bff', textDecorationLine: 'underline' },

  btn: {
    width: '100%',
    backgroundColor: '#226bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  logo: { maxWidth: '80%', maxHeight: '80%' },
  logoHorizontal: { width: 300, height: 300 },
  logoVertical: { width: 200, height: 200 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#999',
  },
});
