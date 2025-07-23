import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// Removed react-native-tab-view, using custom tab logic
import Navbar from '../../components/Navbar';
import { config } from '../../services/appwrite';
import databaseServices from '../../services/databaseServices';

// Move tab components outside to prevent re-creation on every render
function MapTab({
  styles,
  searchQuery,
  setSearchQuery,
  handleDownloadPDF,
  FilterBar,
  filteredData,
  mapRef,
  handleMapPress,
  setSelectedMarker,
  setModalVisible,
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location, barangay, or crime type..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPDF}>
          <Text style={styles.pdfIcon}>📄⬇</Text>
        </TouchableOpacity>
      </View>
      <FilterBar />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 13.9411,
          longitude: 121.1631,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        onPress={handleMapPress}
        minZoomLevel={13}
        maxZoomLevel={18}
      >
        {filteredData.map((marker) => {
          let pinColor = 'gray';
          if ((marker.risk_level || '').toLowerCase() === 'high') pinColor = 'red';
          else if ((marker.risk_level || '').toLowerCase() === 'medium') pinColor = 'orange';
          else if ((marker.risk_level || '').toLowerCase() === 'low') pinColor = 'green';
          else pinColor = 'gray';
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
    </View>
  );
}

function RecordsTab({
  styles,
  filteredData,
  FilterBar,
  formatDateTime,
  setSelectedMarker,
  setModalVisible,
  handleArchiveRecord,
  onEditRecord,
}) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, margin: 12 }}>Crime Records</Text>
      <FilterBar />
      {filteredData.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No records found.</Text>
      ) : (
        filteredData.map((rec) => (
          <View key={rec.id} style={{ borderBottomWidth: 1, borderColor: '#eee', padding: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{rec.offense} ({rec.status})</Text>
            <Text>Barangay: {rec.barangay}</Text>
            <Text>Location: {rec.location}</Text>
            <Text>Date Committed: {formatDateTime(rec.date_time_committed)}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {/* View Button */}
              <TouchableOpacity
                style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 6, marginRight: 8 }}
                onPress={() => {
                  setSelectedMarker(rec);
                  setModalVisible(true);
                }}
              >
                <Text style={{ color: '#fff' }}>View</Text>
              </TouchableOpacity>
              {/* Edit Button */}
              <TouchableOpacity
                style={{ backgroundColor: '#6c63ff', padding: 8, borderRadius: 6, marginRight: 8 }}
                onPress={() => onEditRecord(rec)}
              >
                <Text style={{ color: '#fff' }}>Edit</Text>
              </TouchableOpacity>
              {/* Archive Button */}
              <TouchableOpacity
                style={{ backgroundColor: '#f0ad4e', padding: 8, borderRadius: 6 }}
                onPress={() => handleArchiveRecord(rec.id)}
              >
                <Text style={{ color: '#fff' }}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ArchivedTab({
  styles,
  archivedData,
  formatDateTime,
  handleUnarchiveRecord,
  handleDeleteRecord,
  isAdmin,
}) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, margin: 12 }}>Archived Records</Text>
      {archivedData.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No archived records.</Text>
      ) : (
        archivedData.map((rec) => (
          <View key={rec.id} style={{ borderBottomWidth: 1, borderColor: '#eee', padding: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{rec.offense} ({rec.status})</Text>
            <Text>Barangay: {rec.barangay}</Text>
            <Text>Location: {rec.location}</Text>
            <Text>Date Committed: {formatDateTime(rec.date_time_committed)}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#28a745', padding: 8, borderRadius: 6, marginRight: 8 }}
                onPress={() => handleUnarchiveRecord(rec.id)}
              >
                <Text style={{ color: '#fff' }}>Unarchive</Text>
              </TouchableOpacity>
              {/* Show Delete button only if isAdmin is true */}
              {isAdmin && (
                <TouchableOpacity
                  style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 6 }}
                  onPress={() => handleDeleteRecord(rec.id)}
                >
                  <Text style={{ color: '#fff' }}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CrimeMapScreen() {
  // Helper function to format date string
  // Admin role state
  const [isAdmin, setIsAdmin] = useState(false);

  // On mount, retrieve role from AsyncStorage
  useEffect(() => {
    const loadRole = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        setIsAdmin(role === 'admin');
      } catch (e) {
        setIsAdmin(false);
      }
    };
    loadRole();
  }, []);
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString(undefined, options);
  };

  // State management
  const [barangayRiskData, setBarangayRiskData] = useState([]);
  const mapRef = useRef(null);
  const [markerData, setMarkerData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterCrimeType, setFilterCrimeType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [addRecordBarangayModalVisible, setAddRecordBarangayModalVisible] = useState(false);
  // Edit modal state
  const [editRecordModalVisible, setEditRecordModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  // Edit record logic
  const handleEditRecord = (rec) => {
    setEditFormData({ ...rec });
    setEditRecordModalVisible(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitEditRecord = async () => {
    if (!editFormData) return;
    const requiredFields = [
      'type_of_place',
      'date_time_reported',
      'date_time_committed',
      'offense',
      'type_of_crime',
      'classification_of_crime',
      'victim',
      'suspect',
      'narrative',
      'status',
      'barangay',
      'location',
      'latitude',
      'longitude',
    ];
    const missing = requiredFields.filter(
      (f) => editFormData[f] === '' || editFormData[f] === null || (typeof editFormData[f] === 'undefined')
    );
    if (missing.length > 0) {
      Alert.alert('Validation Error', `Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }
    Alert.alert(
      'Confirm Update',
      'Are you sure you want to update this crime record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'destructive',
          onPress: async () => {
            try {
              const { id, risk_level, crimeRate, archived, ...rest } = editFormData;
              const dataToSubmit = {
                ...rest,
                batch_number:
                  editFormData.batch_number === '' || editFormData.batch_number === null || typeof editFormData.batch_number === 'undefined'
                    ? null
                    : parseInt(editFormData.batch_number, 10),
              };
              await databaseServices.updateDocument(
                config.db,
                config.col.crime_records,
                editFormData.id,
                dataToSubmit
              );
              Alert.alert('Success', 'Crime record updated successfully!');
              setEditRecordModalVisible(false);
              setEditFormData(null);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update crime record. Please try again.');
              console.error('Edit error:', error);
            }
          },
        },
      ]
    );
  };

  // Form state
  const [formData, setFormData] = useState({
    type_of_place: '',
    date_time_reported: new Date(),
    date_time_committed: new Date(),
    offense: '',
    type_of_crime: '',
    classification_of_crime: '',
    victim: '',
    suspect: '',
    narrative: '',
    status: '',
    batch_number: '',
    barangay: '',
    location: '',
    latitude: null,
    longitude: null,
  });

  // DateTimePicker state
  const [showReportedPicker, setShowReportedPicker] = useState(false);
  const [showCommittedPicker, setShowCommittedPicker] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [records, barangayRisks] = await Promise.all([
        databaseServices.listCrimeRecords(),
        databaseServices.getBarangayCrimeRisk()
      ]);
      if (Array.isArray(records) && Array.isArray(barangayRisks)) {
        const riskMap = {};
        barangayRisks.forEach((b) => {
          const key = (b.barangay || '').trim().toLowerCase();
          let riskLabel = 'unknown';
          if (typeof b.riskLevel === 'number') {
            if (b.riskLevel === 0) riskLabel = 'low';
            else if (b.riskLevel === 1) riskLabel = 'medium';
            else if (b.riskLevel === 2) riskLabel = 'high';
          } else if (typeof b.riskLevel === 'string') {
            const rl = b.riskLevel.toLowerCase();
            if (rl === 'low' || rl === 'medium' || rl === 'high') riskLabel = rl;
          }
          riskMap[key] = { risk_level: riskLabel, crimeRate: b.crimeRate };
        });
        const mappedMarkers = records.map((record) => ({
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
          risk_level: riskMap[(record.barangay || '').trim().toLowerCase()]?.risk_level || 'unknown',
          crimeRate: riskMap[(record.barangay || '').trim().toLowerCase()]?.crimeRate,
          archived: record.archived || false,
        }));
        setMarkerData(mappedMarkers);
        setBarangayRiskData(barangayRisks);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please try again.');
      console.error('Fetch error:', error);
    }
  };

  // Filter data
  const barangays = Array.from(new Set(barangayRiskData.map((b) => b.barangay))).filter(Boolean);
  const crimeTypes = Array.from(new Set(markerData.map((m) => m.offense)));
  const statuses = Array.from(new Set(markerData.map((m) => m.status)));

  // Tab logic: filter for each tab
  const filteredData = markerData.filter((marker) => {
    if (marker.archived) return false;
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (marker.type_of_place || '').toLowerCase().includes(search) ||
      (marker.barangay || '').toLowerCase().includes(search) ||
      (marker.location || '').toLowerCase().includes(search) ||
      (marker.type_of_crime || '').toLowerCase().includes(search) ||
      (marker.offense || '').toLowerCase().includes(search);
    const matchesBarangay = !filterBarangay || marker.barangay === filterBarangay;
    const matchesCrimeType = !filterCrimeType || marker.offense === filterCrimeType;
    const matchesStatus = !filterStatus || marker.status === filterStatus;
    return matchesSearch && matchesBarangay && matchesCrimeType && matchesStatus;
  });

  const archivedData = markerData.filter((marker) => marker.archived);

  // Handle map press to select coordinates
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedCoordinates({ latitude, longitude });
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude
    }));
    Alert.alert(
      'Location Selected',
      `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      [
        { text: 'OK' },
        { 
          text: 'Add Record Here', 
          onPress: () => setAddRecordModalVisible(true) 
        }
      ]
    );
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format date for display (12-hour format with AM/PM)
  const formatDisplayDate = (dateObj) => {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    if (isNaN(date.getTime())) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${strTime}`;
  };

  // Submit new crime record
  const handleSubmitRecord = async () => {
    const requiredFields = [
      'type_of_place',
      'date_time_reported',
      'date_time_committed',
      'offense',
      'type_of_crime',
      'classification_of_crime',
      'victim',
      'suspect',
      'narrative',
      'status',
      'barangay',
      'location',
      'latitude',
      'longitude',
    ];
    const missing = requiredFields.filter(
      (f) => formData[f] === '' || formData[f] === null || (typeof formData[f] === 'undefined')
    );
    if (missing.length > 0) {
      Alert.alert('Validation Error', `Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }
    try {
      // Ensure batch_number is an integer or null
      const dataToSubmit = {
        ...formData,
        batch_number:
          formData.batch_number === '' || formData.batch_number === null || typeof formData.batch_number === 'undefined'
            ? null
            : parseInt(formData.batch_number, 10),
        archived: false,
      };
      await databaseServices.createDocument(
        config.db,
        config.col.crime_records,
        dataToSubmit
      );
      Alert.alert('Success', 'Crime record added successfully!');
      setAddRecordModalVisible(false);
      setFormData({
        type_of_place: '',
        date_time_reported: new Date(),
        date_time_committed: new Date(),
        offense: '',
        type_of_crime: '',
        classification_of_crime: '',
        victim: '',
        suspect: '',
        narrative: '',
        status: '',
        batch_number: '',
        barangay: '',
        location: '',
        latitude: null,
        longitude: null,
      });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add crime record. Please try again.');
      console.error('Submission error:', error);
    }
  };

  // Archive a record
  const handleArchiveRecord = (recordId) => {
    Alert.alert(
      'Confirm Archive',
      'Are you sure you want to archive this crime record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseServices.updateDocument(
                config.db,
                config.col.crime_records,
                recordId,
                { archived: true }
              );
              Alert.alert('Success', 'Crime record archived successfully!');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to archive record.');
            }
          },
        },
      ]
    );
  };

  // Unarchive a record
  const handleUnarchiveRecord = (recordId) => {
    Alert.alert(
      'Confirm Unarchive',
      'Are you sure you want to unarchive this crime record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          style: 'default',
          onPress: async () => {
            try {
              await databaseServices.updateDocument(
                config.db,
                config.col.crime_records,
                recordId,
                { archived: false }
              );
              Alert.alert('Success', 'Crime record unarchived successfully!');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to unarchive record.');
            }
          },
        },
      ]
    );
  };

  // Delete a record
  const handleDeleteRecord = (recordId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to permanently delete this crime record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseServices.deleteDocument(
                config.db,
                config.col.crime_records,
                recordId
              );
              Alert.alert('Success', 'Crime record deleted successfully!');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  // PDF export function
  const handleDownloadPDF = async () => {
    try {
      const snapshot = await mapRef.current.takeSnapshot({
        width: 800,
        height: 600,
        format: 'png',
        quality: 0.8,
        result: 'base64'
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      const totalRecords = filteredData.length;
      const highRisk = filteredData.filter(m => m.risk_level === 'high').length;
      const mediumRisk = filteredData.filter(m => m.risk_level === 'medium').length;
      const lowRisk = filteredData.filter(m => m.risk_level === 'low').length;

      let summaryRows = '';
      filteredData.forEach((marker, index) => {
        let riskColor = '#e8f5e8';
        if (marker.risk_level === 'high') riskColor = '#ffebee';
        else if (marker.risk_level === 'medium') riskColor = '#fff3e0';
        else if (marker.risk_level === 'unknown') riskColor = '#f0f0f0';

        summaryRows += `
          <tr style="background-color: ${riskColor};">
            <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${marker.offense || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${marker.barangay || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${marker.location || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-transform: uppercase;">${marker.risk_level || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${marker.status || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDateTime(marker.date_time_committed)}</td>
          </tr>
        `;
      });

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #007AFF; padding-bottom: 10px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .subtitle { font-size: 14px; color: #666; }
              .filters { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .filter-title { font-weight: bold; margin-bottom: 10px; color: #007AFF; }
              .statistics { display: flex; justify-content: space-around; margin: 20px 0; background-color: #f0f8ff; padding: 15px; border-radius: 8px; }
              .stat-item { text-align: center; }
              .stat-number { font-size: 24px; font-weight: bold; color: #007AFF; }
              .stat-label { font-size: 12px; color: #666; }
              .map-container { text-align: center; margin: 20px 0; }
              .map-image { max-width: 100%; border: 2px solid #ddd; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background-color: #007AFF; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
              .legend { margin: 20px 0; background-color: #f8f9fa; padding: 15px; border-radius: 8px; }
              .legend-title { font-weight: bold; margin-bottom: 10px; color: #007AFF; }
              .legend-item { display: inline-block; margin: 5px 15px 5px 0; font-size: 12px; }
              .legend-color { display: inline-block; width: 20px; height: 15px; margin-right: 8px; border-radius: 3px; vertical-align: middle; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">📍 Lipa City Crime Map Report</div>
              <div class="subtitle">Generated on ${dateStr} at ${timeStr}</div>
            </div>

            <div class="filters">
              <div class="filter-title">Applied Filters:</div>
              <div class="filter-item"><strong>Search Query:</strong> ${searchQuery || 'None'}</div>
              <div class="filter-item"><strong>Barangay:</strong> ${filterBarangay || 'All'}</div>
              <div class="filter-item"><strong>Offense:</strong> ${filterCrimeType || 'All'}</div>
              <div class="filter-item"><strong>Status:</strong> ${filterStatus || 'All'}</div>
            </div>

            <div class="statistics">
              <div class="stat-item">
                <div class="stat-number">${totalRecords}</div>
                <div class="stat-label">Total Records</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" style="color: #dc3545;">${highRisk}</div>
                <div class="stat-label">High Risk</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" style="color: #fd7e14;">${mediumRisk}</div>
                <div class="stat-label">Medium Risk</div>
              </div>
              <div class="stat-item">
                <div class="stat-number" style="color: #28a745;">${lowRisk}</div>
                <div class="stat-label">Low Risk</div>
              </div>
            </div>

            <div class="legend">
              <div class="legend-title">Map Legend:</div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #dc3545;"></span>High Risk Areas
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #fd7e14;"></span>Medium Risk Areas
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #28a745;"></span>Low Risk Areas
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #6c757d;"></span>Unknown Risk
              </div>
            </div>

            <div class="map-container">
              <h3>Crime Distribution Map</h3>
              <img src="data:image/png;base64,${snapshot}" class="map-image" />
            </div>

            <div style="page-break-before: always; padding: 0 20px;">
              <h3>Detailed Crime Records</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Offense</th>
                    <th>Barangay</th>
                    <th>Location</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                    <th>Date Committed</th>
                  </tr>
                </thead>
                <tbody>
                  ${summaryRows}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
              <p>This report was generated from the Lipa City Crime Mapping System</p>
              <p>Report contains ${totalRecords} filtered crime records as of ${dateStr}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        fileName: 'Lipa City Crime Map Report.pdf'
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Crime Map Report'
        });
      } else {
        Alert.alert('PDF Generated', 'PDF saved successfully!');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  // Custom tab logic (dashboard style)
  const TABS = [
    { id: 'map', title: 'Map' },
    { id: 'records', title: 'Crime Records' },
    { id: 'archived', title: 'Archived' },
  ];
  const [activeTab, setActiveTab] = useState('map');

  // Tab Button (dashboard style)
  const TabButton = ({ tab, isActive, onPress }) => (
    <TouchableOpacity
      style={[{
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: isActive ? '#007AFF' : 'transparent',
        backgroundColor: '#fff',
      }]}
      onPress={onPress}
    >
      <Text style={{ color: isActive ? '#007AFF' : '#888', fontWeight: isActive ? 'bold' : '500', fontSize: 16 }}>{tab.title}</Text>
    </TouchableOpacity>
  );

  // Filter dropdowns (simple modal pickers)
  const FilterBar = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 10 }}>
      {/* Barangay Filter */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginRight: 4 }}
        onPress={() => setShowBarangayFilter(true)}
      >
        <Text style={{ color: filterBarangay ? '#222' : '#888' }}>{filterBarangay || 'All Barangays'}</Text>
      </TouchableOpacity>
      {/* Offense Filter */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginRight: 4 }}
        onPress={() => setShowCrimeTypeFilter(true)}
      >
        <Text style={{ color: filterCrimeType ? '#222' : '#888' }}>{filterCrimeType || 'All Offenses'}</Text>
      </TouchableOpacity>
      {/* Status Filter */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10 }}
        onPress={() => setShowStatusFilter(true)}
      >
        <Text style={{ color: filterStatus ? '#222' : '#888' }}>{filterStatus || 'All Statuses'}</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter modal states
  const [showBarangayFilter, setShowBarangayFilter] = useState(false);
  const [showCrimeTypeFilter, setShowCrimeTypeFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);


  // Main render
  return (
    <View style={styles.container}>
      <Navbar />
      <Text style={styles.header}>📍 Lipa City Crime Map</Text>
      {/* Custom Tab Bar */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 }}>
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </View>
      {/* Tab Content */}
      {activeTab === 'map' && (
        <MapTab
          styles={styles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleDownloadPDF={handleDownloadPDF}
          FilterBar={FilterBar}
          filteredData={filteredData}
          mapRef={mapRef}
          handleMapPress={handleMapPress}
          setSelectedMarker={setSelectedMarker}
          setModalVisible={setModalVisible}
        />
      )}
      {activeTab === 'records' && (
        <RecordsTab
          styles={styles}
          filteredData={filteredData}
          FilterBar={FilterBar}
          formatDateTime={formatDateTime}
          setSelectedMarker={setSelectedMarker}
          setModalVisible={setModalVisible}
          handleArchiveRecord={handleArchiveRecord}
          onEditRecord={handleEditRecord}
        />
      )}
      {/* Edit Record Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editRecordModalVisible}
        onRequestClose={() => setEditRecordModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            contentContainerStyle={styles.addModalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.addModalTitle}>Edit Crime Record</Text>
            {editFormData && (
              <>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Barangay <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.barangay}
                    onChangeText={(text) => handleEditInputChange('barangay', text)}
                    placeholder="Barangay"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Location <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.location}
                    onChangeText={(text) => handleEditInputChange('location', text)}
                    placeholder="Enter specific location"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Type of Place <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.type_of_place}
                    onChangeText={(text) => handleEditInputChange('type_of_place', text)}
                    placeholder="e.g. Residential, Commercial"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Date Reported <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.date_time_reported?.toString()}
                    onChangeText={(text) => handleEditInputChange('date_time_reported', text)}
                    placeholder="Date Reported"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Date Committed <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.date_time_committed?.toString()}
                    onChangeText={(text) => handleEditInputChange('date_time_committed', text)}
                    placeholder="Date Committed"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Offense <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.offense}
                    onChangeText={(text) => handleEditInputChange('offense', text)}
                    placeholder="e.g. Theft, Assault"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Type of Crime <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.type_of_crime}
                    onChangeText={(text) => handleEditInputChange('type_of_crime', text)}
                    placeholder="e.g. Against Property, Against Persons"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Classification <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.classification_of_crime}
                    onChangeText={(text) => handleEditInputChange('classification_of_crime', text)}
                    placeholder="e.g. Index Crime, Non-Index Crime"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Victim <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.victim}
                    onChangeText={(text) => handleEditInputChange('victim', text)}
                    placeholder="Enter victim details"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Suspect <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.suspect}
                    onChangeText={(text) => handleEditInputChange('suspect', text)}
                    placeholder="Enter suspect details"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Narrative <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput, { height: 100 }]}
                    value={editFormData.narrative}
                    onChangeText={(text) => handleEditInputChange('narrative', text)}
                    placeholder="Describe the incident..."
                    multiline
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Status <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.status}
                    onChangeText={(text) => handleEditInputChange('status', text)}
                    placeholder="e.g. Open, Closed, Under Investigation"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Batch Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.batch_number?.toString() || ''}
                    onChangeText={(text) => handleEditInputChange('batch_number', text.replace(/[^0-9]/g, ''))}
                    placeholder="Enter batch number (optional)"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Coordinates <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.latitude ? `${editFormData.latitude}` : ''}
                    onChangeText={(text) => handleEditInputChange('latitude', parseFloat(text) || 0)}
                    placeholder="Latitude"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.formInput, { marginTop: 8 }]}
                    value={editFormData.longitude ? `${editFormData.longitude}` : ''}
                    onChangeText={(text) => handleEditInputChange('longitude', parseFloat(text) || 0)}
                    placeholder="Longitude"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setEditRecordModalVisible(false)}
                  >
                    <Text style={styles.formButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleSubmitEditRecord}
                  >
                    <Text style={styles.formButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      {activeTab === 'archived' && (
        <ArchivedTab
          styles={styles}
          archivedData={archivedData}
          formatDateTime={formatDateTime}
          handleUnarchiveRecord={handleUnarchiveRecord}
          handleDeleteRecord={handleDeleteRecord}
          isAdmin={isAdmin}
        />
      )}

      {/* Filter Modals */}
      <Modal visible={showBarangayFilter} transparent animationType="fade" onRequestClose={() => setShowBarangayFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Barangay</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => { setFilterBarangay(''); setShowBarangayFilter(false); }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>All Barangays</Text>
              </TouchableOpacity>
              {barangays.map((b, idx) => (
                <TouchableOpacity key={b || `filter-barangay-${idx}`} style={{ padding: 12 }} onPress={() => { setFilterBarangay(b); setShowBarangayFilter(false); }}>
                  <Text style={{ color: '#1F2937' }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowBarangayFilter(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showCrimeTypeFilter} transparent animationType="fade" onRequestClose={() => setShowCrimeTypeFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Offense</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => { setFilterCrimeType(''); setShowCrimeTypeFilter(false); }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>All Offenses</Text>
              </TouchableOpacity>
              {crimeTypes.map((c, idx) => (
                <TouchableOpacity key={c || `filter-crime-${idx}`} style={{ padding: 12 }} onPress={() => { setFilterCrimeType(c); setShowCrimeTypeFilter(false); }}>
                  <Text style={{ color: '#1F2937' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowCrimeTypeFilter(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showStatusFilter} transparent animationType="fade" onRequestClose={() => setShowStatusFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => { setFilterStatus(''); setShowStatusFilter(false); }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>All Statuses</Text>
              </TouchableOpacity>
              {statuses.map((s, idx) => (
                <TouchableOpacity key={s || `filter-status-${idx}`} style={{ padding: 12 }} onPress={() => { setFilterStatus(s); setShowStatusFilter(false); }}>
                  <Text style={{ color: '#1F2937' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowStatusFilter(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Marker Details Modal (shared) */}
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
                <View style={styles.modalIconRow}>
                  <Text style={styles.modalOffenseTitle}>{selectedMarker.offense || 'Offense'}</Text>
                </View>
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
                    <Text style={[styles.modalHighlightValue, selectedMarker.risk_level === 'high' ? {color: 'red'} : selectedMarker.risk_level === 'medium' ? {color: 'orange'} : {color: 'green'}]}>
                      {selectedMarker.risk_level || 'N/A'}
                    </Text>
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
                <Text style={styles.modalSectionTitle}>Details</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Type of Place:</Text> {selectedMarker.type_of_place}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Date Reported:</Text> {formatDateTime(selectedMarker.date_time_reported)}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Date Committed:</Text> {formatDateTime(selectedMarker.date_time_committed)}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Type of Crime:</Text> {selectedMarker.type_of_crime}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Classification:</Text> {selectedMarker.classification_of_crime}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Victim:</Text> {selectedMarker.victim}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Suspect:</Text> {selectedMarker.suspect}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Narrative:</Text> {selectedMarker.narrative}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Batch Number:</Text> {selectedMarker.batch_number}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalDetailLabel}>Coordinates:</Text> {selectedMarker.latitude}, {selectedMarker.longitude}</Text>
              </ScrollView>
            )}
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Add Record Modal (Map tab only, but keep here for now) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addRecordModalVisible}
        onRequestClose={() => setAddRecordModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            contentContainerStyle={styles.addModalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.addModalTitle}>Add New Crime Record</Text>
            {/* ...existing code for add record form... */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Barangay <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.formInput, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}
                onPress={() => setAddRecordBarangayModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={{color: formData.barangay ? '#222' : '#aaa'}}>
                  {formData.barangay || 'Select barangay'}
                </Text>
                <Text style={{fontSize: 16, color: '#888'}}>▼</Text>
              </TouchableOpacity>
              <Modal
                transparent={true}
                visible={addRecordBarangayModalVisible}
                animationType="fade"
                onRequestClose={() => setAddRecordBarangayModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Select Barangay</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {barangays.map((b, idx) => (
                        <TouchableOpacity
                          key={b || `add-barangay-${idx}`}
                          style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                          onPress={() => {
                            handleInputChange('barangay', b);
                            setAddRecordBarangayModalVisible(false);
                          }}
                        >
                          <Text style={{ fontSize: 16, color: '#1F2937' }}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setAddRecordBarangayModalVisible(false)}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter specific location"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type of Place <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.type_of_place}
                onChangeText={(text) => handleInputChange('type_of_place', text)}
                placeholder="e.g. Residential, Commercial"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Date Reported <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowReportedPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{color: formData.date_time_reported ? '#222' : '#aaa'}}>
                  {formatDisplayDate(formData.date_time_reported) || 'Select date'}
                </Text>
              </TouchableOpacity>
              {showReportedPicker && (
                <DateTimePicker
                  value={new Date(formData.date_time_reported)}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowReportedPicker(false);
                    if (selectedDate) {
                      handleInputChange('date_time_reported', selectedDate);
                    }
                  }}
                />
              )}
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Date Committed <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowCommittedPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{color: formData.date_time_committed ? '#222' : '#aaa'}}>
                  {formatDisplayDate(formData.date_time_committed) || 'Select date'}
                </Text>
              </TouchableOpacity>
              {showCommittedPicker && (
                <DateTimePicker
                  value={new Date(formData.date_time_committed)}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowCommittedPicker(false);
                    if (selectedDate) {
                      handleInputChange('date_time_committed', selectedDate);
                    }
                  }}
                />
              )}
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Offense <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.offense}
                onChangeText={(text) => handleInputChange('offense', text)}
                placeholder="e.g. Theft, Assault"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type of Crime <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.type_of_crime}
                onChangeText={(text) => handleInputChange('type_of_crime', text)}
                placeholder="e.g. Against Property, Against Persons"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Classification <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.classification_of_crime}
                onChangeText={(text) => handleInputChange('classification_of_crime', text)}
                placeholder="e.g. Index Crime, Non-Index Crime"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Victim <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.victim}
                onChangeText={(text) => handleInputChange('victim', text)}
                placeholder="Enter victim details"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Suspect <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.suspect}
                onChangeText={(text) => handleInputChange('suspect', text)}
                placeholder="Enter suspect details"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Narrative <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.formInput, { height: 100 }]}
                value={formData.narrative}
                onChangeText={(text) => handleInputChange('narrative', text)}
                placeholder="Describe the incident..."
                multiline
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Status <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                value={formData.status}
                onChangeText={(text) => handleInputChange('status', text)}
                placeholder="e.g. Open, Closed, Under Investigation"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Batch Number</Text>
              <TextInput
                style={styles.formInput}
                value={formData.batch_number?.toString() || ''}
                onChangeText={(text) => handleInputChange('batch_number', text.replace(/[^0-9]/g, ''))}
                placeholder="Enter batch number (optional)"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Coordinates <Text style={styles.required}>*</Text></Text>
              <Text style={styles.coordinatesText}>
                {selectedCoordinates && formData.latitude && formData.longitude
                  ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                  : "Tap on map to select location"}
              </Text>
            </View>
            <View style={styles.formButtonContainer}>
              <TouchableOpacity 
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => setAddRecordModalVisible(false)}
              >
                <Text style={styles.formButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.formButton, styles.submitButton]}
                onPress={handleSubmitRecord}
              >
                <Text style={styles.formButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 10,
    color: '#333'
  },
  searchContainer: { 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  searchInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 10, 
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fff'
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    fontSize: 18,
    color: '#fff'
  },
  pdfButton: {
    marginLeft: 10,
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pdfIcon: {
    fontSize: 18,
    color: '#fff'
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
  addModalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    width: '94%',
    marginVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
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
  modalButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#333',
    fontWeight: '600'
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  coordinatesText: {
    padding: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  formButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  formButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});