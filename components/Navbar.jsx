import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function Navbar() {
  const router = useRouter();
  const isMobile = screenWidth < 768;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const navLinks = [
    { label: 'Home', icon: 'home', route: '/landing' },
    { label: 'Crime Mapping', icon: 'map' },
    { label: 'Dashboard', icon: 'bar-chart' },
    { label: 'Population', icon: 'group', route: '/population' },
    { label: 'Audit Logs', icon: 'history' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'Create Account', icon: 'person-add', route: '/create_account' },
    { label: 'Logout', icon: 'logout', route: 'logout' }, // handled separately
  ];

  const handleNavigate = (route) => {
    if (route === 'logout') {
      setLogoutModalVisible(true);
    } else if (route) {
      router.push(route);
      setDrawerVisible(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(false);
    router.replace('/'); // assuming app/index.jsx is your initial route
  };

  return (
    <View>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarLeft}>
          <Image source={require('../assets/images/logo1.png')} style={styles.logoSmall} />
          <Text style={styles.navbarBrand}>CrimeMapping</Text>
        </View>

        {isMobile ? (
          <TouchableOpacity onPress={() => setDrawerVisible(true)}>
            <MaterialIcons name="menu" size={28} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.navLinksRight}>
            {navLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.navLinkContainer}
                onPress={() => handleNavigate(link.route)}
              >
                <MaterialIcons name={link.icon} size={18} color="white" />
                <Text style={styles.navLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Sidebar Drawer for Mobile */}
      <Modal visible={drawerVisible} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setDrawerVisible(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <MaterialIcons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            {navLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.drawerLink}
                onPress={() => handleNavigate(link.route)}
              >
                <MaterialIcons name={link.icon} size={20} color="#002D72" />
                <Text style={styles.drawerLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirm Logout</Text>
            <Text style={styles.confirmText}>Are you sure you want to logout?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={handleLogout} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#002D72',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSmall: { height: 32, width: 32, resizeMode: 'contain' },
  navbarBrand: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  navLinksRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLinkContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, gap: 4 },
  navLink: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  // Drawer Styles
  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    width: 250,
    backgroundColor: 'white',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerTitle: { fontSize: 18, fontWeight: 'bold', color: '#002D72' },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    gap: 10,
  },
  drawerLinkText: { fontSize: 16, color: '#002D72', fontWeight: '500' },

  // Logout Confirmation Modal
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: 'white',
    width: 300,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002D72',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});
