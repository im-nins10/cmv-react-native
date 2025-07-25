import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function Navbar() {
  const router = useRouter();
  const isMobile = screenWidth < 768;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('role');
        if (storedRole) {
          setRole(storedRole);
        }
      } catch (error) {
        console.error('Failed to fetch role from AsyncStorage', error);
      }
    };
    fetchRole();
  }, []);

  const navLinks = [
    { label: 'Home', icon: 'home', route: '/landing' },
    { label: 'Crime Mapping', icon: 'map', route: '/mapping' },
    { label: 'Dashboard', icon: 'bar-chart', route: '/dashboard' },
    { label: 'Population', icon: 'group', route: '/population' },
    { label: 'Audit Logs', icon: 'history', route: '/audit_logs' },
    { label: 'My Profile', icon: 'person', route: '/profile' },
    { label: 'User Management', icon: 'person-add', route: '/create_account' },
    { label: 'Logout', icon: 'logout', route: 'logout' },
  ];

  const filteredNavLinks =
    role === 'invest'
      ? navLinks.filter(link => link.label !== 'Audit Logs' && link.label !== 'Create Account')
      : navLinks;

  const handleNavigate = (route) => {
    if (route === 'logout') {
      handleLogout();
    } else if (route) {
      router.push(route);
      setDrawerVisible(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View style={styles.navbarLeft}>
            <Image source={require('../assets/images/logo1.png')} style={styles.logoSmall} />
            <Text style={styles.navbarBrand}>Crime Mapping</Text>
          </View>

          {isMobile ? (
            <TouchableOpacity onPress={() => setDrawerVisible(true)}>
              <MaterialIcons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={styles.navLinksRight}>
              {filteredNavLinks.map((link, index) => (
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
          <SafeAreaView style={styles.drawerSafeArea}>
            <View style={styles.drawerOverlay}>
              <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setDrawerVisible(false)} />
              <View style={styles.drawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Menu</Text>
                  <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                    <MaterialIcons name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                {filteredNavLinks.map((link, index) => (
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
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#002D72',
  },
  drawerSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
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
});