import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Menu, Button as PaperButton } from 'react-native-paper';
import * as XLSX from 'xlsx';
import Navbar from '../../components/Navbar';
import { config } from '../../services/appwrite';
import databaseServices from '../../services/databaseServices';

const lipaBounds = {
  northEast: { latitude: 13.9700, longitude: 121.1900 },
  southWest: { latitude: 13.9100, longitude: 121.1300 },
};

export default function CrimeMapScreen() {
  // Store barangay risk data for heatmap
  const [barangayRiskData, setBarangayRiskData] = useState([]);
  const mapRef = useRef(null);
  const [markerData, setMarkerData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterCrimeType, setFilterCrimeType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [menuVisible1, setMenuVisible1] = useState(false);
  const [menuVisible2, setMenuVisible2] = useState(false);
  const [menuVisible3, setMenuVisible3] = useState(false);

  useEffect(() => {
    async function fetchCrimeRecordsAndRisk() {
      const [records, barangayRisks] = await Promise.all([
        databaseServices.listCrimeRecords(),
        databaseServices.getBarangayCrimeRisk()
      ]);
      if (Array.isArray(records) && Array.isArray(barangayRisks)) {
        // Map barangay to riskLevel and crimeRate (normalize names)
        const riskMap = {};
        barangayRisks.forEach((b) => {
          const key = (b.barangay || '').trim().toLowerCase();
          riskMap[key] = { risk_level: b.riskLevel, crimeRate: b.crimeRate };
        });
        // Map records to marker format expected by the map, with riskLevel and crimeRate
        const mappedMarkers = records.map((record) => {
          const barangayKey = (record.barangay || '').trim().toLowerCase();
          const riskInfo = riskMap[barangayKey] || { risk_level: 'unknown', crimeRate: undefined };
          return {
            id: record.$id,
            type_of_place: record.type_of_place || '',
            date_time_reported: record.date_time_reported || '',
            date_time_committed: record.date_time_committed || '',
            offense: record.offense || '',
            type_of_crime: record.type_of_crime || '',
            classification_of_crime: record.classification_of_crime || '',
            victim: record.victim || '',
            suspect: record.suspect || '',
            narrative: record.narrative || '',
            status: record.status || '',
            batch_number: record.batch_number || '',
            barangay: record.barangay || '',
            location: record.location || '',
            latitude: parseFloat(record.latitude) || 0,
            longitude: parseFloat(record.longitude) || 0,
            risk_level: riskInfo.risk_level,
            crimeRate: riskInfo.crimeRate,
          };
        });
        setMarkerData(mappedMarkers);
        setBarangayRiskData(barangayRisks);
      } else {
        Alert.alert('Error', 'Failed to fetch crime records or risk levels.');
      }
    }
    fetchCrimeRecordsAndRisk();
  }, []);

  const barangays = Array.from(new Set(markerData.map((m) => m.barangay)));
  const crimeTypes = Array.from(new Set(markerData.map((m) => m.crimeType)));
  const statuses = Array.from(new Set(markerData.map((m) => m.status)));

  const filteredData = markerData.filter((marker) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (marker.type_of_place || '').toLowerCase().includes(search) ||
      (marker.barangay || '').toLowerCase().includes(search) ||
      (marker.location || '').toLowerCase().includes(search) ||
      (marker.type_of_crime || '').toLowerCase().includes(search);

    const matchesBarangay = !filterBarangay || marker.barangay === filterBarangay;
    const matchesCrimeType = !filterCrimeType || marker.type_of_crime === filterCrimeType;
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
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'
        ],
        copyToCacheDirectory: true,
      });

      if (res.type === 'success') {
        Alert.alert('📁 File Selected', `You selected: ${res.name}`);
        const fileUri = res.uri;
        const fileData = await fetch(fileUri).then(r => r.arrayBuffer());
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        let failCount = 0;
        for (const row of rows) {
          // Map row fields to your Appwrite schema
          // You may need to adjust field names to match your database
          const data = {
            type_of_place: row.type_of_place || row['Type of Place'] || '',
            date_time_reported: row.date_time_reported || row['Date Reported'] || '',
            date_time_committed: row.date_time_committed || row['Date Committed'] || '',
            offense: row.offense || row['Offense'] || '',
            type_of_crime: row.type_of_crime || row['Type of Crime'] || '',
            classification_of_crime: row.classification_of_crime || row['Classification of Crime'] || '',
            victim: row.victim || row['Victim'] || '',
            suspect: row.suspect || row['Suspect'] || '',
            narrative: row.narrative || row['Narrative'] || '',
            status: row.status || row['Status'] || '',
            batch_number: row.batch_number || row['Batch Number'] || '',
            barangay: row.barangay || row['Barangay'] || '',
            location: row.location || row['Location'] || '',
            latitude: row.latitude || row['Latitude'] || '',
            longitude: row.longitude || row['Longitude'] || '',
          };
          try {
            await databaseServices.createDocument(
              config.db,
              config.col.crime_records,
              data
            );
            successCount++;
          } catch (err) {
            failCount++;
          }
        }
        if (successCount > 0 && failCount === 0) {
          Alert.alert('✅ Upload Success', 'All records were uploaded successfully!');
        } else if (successCount > 0 && failCount > 0) {
          Alert.alert('⚠️ Partial Success', `Success: ${successCount}, Failed: ${failCount}`);
        } else {
          Alert.alert('❌ Upload Failed', 'No records were uploaded.');
        }
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
            {barangays.map((b, i) => (
              <Menu.Item key={b || `barangay-${i}`} onPress={() => setFilterBarangay(b)} title={b} />
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
            {crimeTypes.map((c, i) => (
              <Menu.Item key={c || `crimeType-${i}`} onPress={() => setFilterCrimeType(c)} title={c} />
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
            {statuses.map((s, i) => (
              <Menu.Item key={s || `status-${i}`} onPress={() => setFilterStatus(s)} title={s} />
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
        {/* Only colored pins for crime records */}
        {/* Pins for individual crime records */}
        {filteredData.map((marker) => {
          let pinColor = 'gray';
          if ((marker.risk_level || '').toLowerCase() === 'high') pinColor = 'red';
          else if ((marker.risk_level || '').toLowerCase() === 'medium') pinColor = 'orange';
          else if ((marker.risk_level || '').toLowerCase() === 'low') pinColor = 'green';

          return (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.type_of_place || marker.location || 'Crime Location'}
              description={`${marker.type_of_crime || ''} - ${marker.status || ''}`}
              pinColor={pinColor}
              onPress={() => {
                setSelectedMarker(marker);
                setModalVisible(true);
              }}
            />
          );
        })}
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
            {selectedMarker && (
              <ScrollView>
                {/* Offense Title Only */}
                <View style={styles.modalIconRow}>
                  <Text style={styles.modalOffenseTitle}>{selectedMarker.offense || 'Offense'}</Text>
                </View>

                {/* Highlighted Details */}
                <View style={styles.modalHighlightRow}>
                  <View style={[styles.modalHighlightBox, {backgroundColor: '#ffe5e5'}]}>
                    <Text style={styles.modalHighlightLabel}>Status</Text>
                    <Text style={styles.modalHighlightValue}>{selectedMarker.status}</Text>
                  </View>
                  <View style={[styles.modalHighlightBox, {backgroundColor: '#e5f7ff'}]}>
                    <Text style={styles.modalHighlightLabel}>Crime Rate</Text>
                    <Text style={styles.modalHighlightValue}>{selectedMarker.crimeRate !== undefined ? selectedMarker.crimeRate.toFixed(4) : 'N/A'}</Text>
                  </View>
                  <View style={[styles.modalHighlightBox, {backgroundColor: '#fffbe5'}]}>
                    <Text style={styles.modalHighlightLabel}>Risk Level</Text>
                    <Text style={[styles.modalHighlightValue, selectedMarker.risk_level === 'high' ? {color: 'red'} : selectedMarker.risk_level === 'medium' ? {color: 'orange'} : {color: 'green'}]}>{selectedMarker.risk_level || 'N/A'}</Text>
                  </View>
                </View>
                <View style={[styles.modalHighlightBox, {backgroundColor: '#e5ffe5', marginBottom: 10}]}> 
                  <Text style={styles.modalHighlightLabel}>Barangay & Location</Text>
                  <Text style={styles.modalHighlightValue}>
                    {selectedMarker.barangay && selectedMarker.location
                      ? `${selectedMarker.barangay}, ${selectedMarker.location}`
                      : selectedMarker.barangay || selectedMarker.location || 'N/A'}
                  </Text>
                </View>

                {/* Other Details */}
                <Text style={styles.modalSectionTitle}>Details</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Type of Place:</Text> {selectedMarker.type_of_place}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Date Reported:</Text> {selectedMarker.date_time_reported}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Date Committed:</Text> {selectedMarker.date_time_committed}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Type of Crime:</Text> {selectedMarker.type_of_crime}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Classification:</Text> {selectedMarker.classification_of_crime}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Victim:</Text> {selectedMarker.victim}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Suspect:</Text> {selectedMarker.suspect}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Narrative:</Text> {selectedMarker.narrative}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Batch Number:</Text> {selectedMarker.batch_number}</Text>
                {/* Location now combined above with Barangay */}
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Coordinates:</Text> {selectedMarker.latitude}, {selectedMarker.longitude}</Text>
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
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  modalOffenseIcon: {
    fontSize: 36,
    marginRight: 10,
  },
  modalOffenseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalHighlightBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    elevation: 2,
  },
  modalHighlightLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  modalHighlightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#007AFF',
  },
  modalDetail: {
    fontSize: 14,
    marginBottom: 2,
    color: '#444',
  },
  modalDetailLabel: {
    fontWeight: 'bold',
    color: '#222',
  },
})