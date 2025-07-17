import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Button,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as DocumentPicker from 'expo-document-picker';
import { Menu, Button as PaperButton } from 'react-native-paper';
import Navbar from '../../components/Navbar';

const initialMarkerData = [
  {
    id: 1,
    title: 'SM City Lipa',
    latitude: 13.9549,
    longitude: 121.1633,
    barangay: 'Marawoy',
    exactLocation: 'SM City Lipa Mall',
    crimeType: 'Theft',
    status: 'Under Investigation',
    description: 'Reported theft at the mall parking area',
    dateReported: '2024-01-15',
  },
  {
    id: 2,
    title: 'Robinsons Lipa',
    latitude: 13.9425,
    longitude: 121.1511,
    barangay: 'Mataas na Lupa',
    exactLocation: 'Robinsons Place Lipa',
    crimeType: 'Robbery',
    status: 'Resolved',
    description: 'Armed robbery incident near the mall entrance',
    dateReported: '2024-01-10',
  },
  {
    id: 3,
    title: 'Lipa Medix',
    latitude: 13.9479,
    longitude: 121.1569,
    barangay: 'Poblacion',
    exactLocation: 'Lipa Medix Hospital',
    crimeType: 'Vandalism',
    status: 'Pending',
    description: 'Vandalism reported at hospital premises',
    dateReported: '2024-01-20',
  },
  {
    id: 4,
    title: 'Lipa Cathedral',
    latitude: 13.9411,
    longitude: 121.1647,
    barangay: 'Poblacion',
    exactLocation: 'San Sebastian Cathedral',
    crimeType: 'Pickpocketing',
    status: 'Under Investigation',
    description: 'Multiple pickpocketing incidents during mass',
    dateReported: '2024-01-12',
  },
  {
    id: 5,
    title: 'Cafe de Lipa',
    latitude: 13.9465,
    longitude: 121.1525,
    barangay: 'Poblacion',
    exactLocation: 'Cafe de Lipa Coffee Shop',
    crimeType: 'Fraud',
    status: 'Resolved',
    description: 'Credit card fraud reported by customers',
    dateReported: '2024-01-08',
  },
];

const lipaBounds = {
  northEast: { latitude: 13.9700, longitude: 121.1900 },
  southWest: { latitude: 13.9100, longitude: 121.1300 },
};

export default function CrimeMapScreen() {
  const mapRef = useRef(null);
  const [markerData, setMarkerData] = useState(initialMarkerData);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterCrimeType, setFilterCrimeType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [menuVisible1, setMenuVisible1] = useState(false);
  const [menuVisible2, setMenuVisible2] = useState(false);
  const [menuVisible3, setMenuVisible3] = useState(false);

  const barangays = Array.from(new Set(markerData.map((m) => m.barangay)));
  const crimeTypes = Array.from(new Set(markerData.map((m) => m.crimeType)));
  const statuses = Array.from(new Set(markerData.map((m) => m.status)));

  const filteredData = markerData.filter((marker) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      marker.title.toLowerCase().includes(search) ||
      marker.barangay.toLowerCase().includes(search) ||
      marker.exactLocation.toLowerCase().includes(search) ||
      marker.crimeType.toLowerCase().includes(search);

    const matchesBarangay = !filterBarangay || marker.barangay === filterBarangay;
    const matchesCrimeType = !filterCrimeType || marker.crimeType === filterCrimeType;
    const matchesStatus = !filterStatus || marker.status === filterStatus;

    return matchesSearch && matchesBarangay && matchesCrimeType && matchesStatus;
  });

  const handleRegionChangeComplete = (region) => {
    const { latitude, longitude } = region;
    if (
      latitude > lipaBounds.northEast.latitude ||
      latitude < lipaBounds.southWest.latitude ||
      longitude > lipaBounds.northEast.longitude ||
      longitude < lipaBounds.southWest.longitude
    ) {
      Alert.alert('📍 Outside Lipa City', 'Map is restricted to Lipa City only.');
      mapRef.current?.animateToRegion({
        latitude: 13.9411,
        longitude: 121.1631,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      });
    }
  };

  const handleImportFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (res.type === 'success') {
        Alert.alert('📁 File Selected', `You selected: ${res.name}`);
        // TODO: parse and import crime records
      }
    } catch (error) {
      Alert.alert('❌ File Import Error', 'An error occurred while importing the file.');
    }
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <Text style={styles.header}>📍 Lipa City Crime Map</Text>

      {/* Search + Import */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location, barangay, or crime type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleImportFile}>
          <Text style={styles.iconButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Filters */}
      <View style={styles.filterRow}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Barangay</Text>
          <Menu
            visible={menuVisible1}
            onDismiss={() => setMenuVisible1(false)}
            anchor={
              <PaperButton mode="outlined" onPress={() => setMenuVisible1(true)}>
                {filterBarangay || 'All'}
              </PaperButton>
            }
          >
            <Menu.Item onPress={() => setFilterBarangay('')} title="All" />
            {barangays.map((b) => (
              <Menu.Item key={b} onPress={() => setFilterBarangay(b)} title={b} />
            ))}
          </Menu>
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Crime Type</Text>
          <Menu
            visible={menuVisible2}
            onDismiss={() => setMenuVisible2(false)}
            anchor={
              <PaperButton mode="outlined" onPress={() => setMenuVisible2(true)}>
                {filterCrimeType || 'All'}
              </PaperButton>
            }
          >
            <Menu.Item onPress={() => setFilterCrimeType('')} title="All" />
            {crimeTypes.map((c) => (
              <Menu.Item key={c} onPress={() => setFilterCrimeType(c)} title={c} />
            ))}
          </Menu>
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Status</Text>
          <Menu
            visible={menuVisible3}
            onDismiss={() => setMenuVisible3(false)}
            anchor={
              <PaperButton mode="outlined" onPress={() => setMenuVisible3(true)}>
                {filterStatus || 'All'}
              </PaperButton>
            }
          >
            <Menu.Item onPress={() => setFilterStatus('')} title="All" />
            {statuses.map((s) => (
              <Menu.Item key={s} onPress={() => setFilterStatus(s)} title={s} />
            ))}
          </Menu>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 13.9411,
          longitude: 121.1631,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        minZoomLevel={13}
        maxZoomLevel={18}
      >
        {filteredData.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={`${marker.crimeType} - ${marker.status}`}
            onPress={() => {
              setSelectedMarker(marker);
              setModalVisible(true);
            }}
          />
        ))}
      </MapView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crime Details</Text>
            {selectedMarker && (
              <ScrollView>
                <Text>Title: {selectedMarker.title}</Text>
                <Text>Barangay: {selectedMarker.barangay}</Text>
                <Text>Location: {selectedMarker.exactLocation}</Text>
                <Text>Crime Type: {selectedMarker.crimeType}</Text>
                <Text>Status: {selectedMarker.status}</Text>
                <Text>Date Reported: {selectedMarker.dateReported}</Text>
                <Text>Description: {selectedMarker.description}</Text>
                <Text>Coordinates: {selectedMarker.latitude}, {selectedMarker.longitude}</Text>
              </ScrollView>
            )}
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  searchContainer: { padding: 10, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 },
  iconButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  iconButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
    zIndex: 10,
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dropdownLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  map: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
