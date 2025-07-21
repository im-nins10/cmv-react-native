import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import * as XLSX from 'xlsx';
import Navbar from '../../components/Navbar';
import { config } from '../../services/appwrite';
import databaseServices from '../../services/databaseServices';

const lipaBounds = {
  northEast: { latitude: 13.9700, longitude: 121.1900 },
  southWest: { latitude: 13.9100, longitude: 121.1300 },
};

export default function CrimeMapScreen() {
  // Helper function to format date string to "MM/DD/YYYY hh:mm AM/PM" format
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // return original if invalid date
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

  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [crimeTypeModalVisible, setCrimeTypeModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

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
          // Normalize riskLevel to string labels
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
  const crimeTypes = Array.from(new Set(markerData.map((m) => m.offense)));
  const statuses = Array.from(new Set(markerData.map((m) => m.status)));

  const filteredData = markerData.filter((marker) => {
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
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px 40px 40px 40px; 
                color: #333; 
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px; 
                border-bottom: 2px solid #007AFF;
                padding-bottom: 10px;
              }
              .title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 5px; 
              }
              .subtitle { 
                font-size: 14px; 
                color: #666; 
              }
              .filters { 
                background-color: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 20px; 
              }
              .filter-title { 
                font-weight: bold; 
                margin-bottom: 10px; 
                color: #007AFF; 
              }
              .filter-item { 
                margin: 5px 0; 
              }
              .statistics { 
                display: flex; 
                justify-content: space-around; 
                margin: 20px 0; 
                background-color: #f0f8ff;
                padding: 15px;
                border-radius: 8px;
              }
              .stat-item { 
                text-align: center; 
              }
              .stat-number { 
                font-size: 24px; 
                font-weight: bold; 
                color: #007AFF; 
              }
              .stat-label { 
                font-size: 12px; 
                color: #666; 
              }
              .map-container { 
                text-align: center; 
                margin: 20px 0; 
              }
              .map-image { 
                max-width: 100%; 
                border: 2px solid #ddd; 
                border-radius: 8px; 
              }
              .table-container { 
                margin-top: 30px; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 11px; 
              }
              th { 
                background-color: #007AFF; 
                color: white; 
                padding: 10px; 
                text-align: left; 
                border: 1px solid #ddd; 
              }
              .legend { 
                margin: 20px 0; 
                background-color: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
              }
              .legend-title { 
                font-weight: bold; 
                margin-bottom: 10px; 
                color: #007AFF; 
              }
              .legend-item {
                display: inline-block; 
                margin: 5px 15px 5px 0; 
                font-size: 12px; 
              }
              .legend-color { 
                display: inline-block; 
                width: 20px; 
                height: 15px; 
                margin-right: 8px; 
                border-radius: 3px; 
                vertical-align: middle; 
              }
              .page-break { 
                page-break-before: always; 
              }
              h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #007AFF;
              }
              table {
                font-family: Arial, sans-serif;
                font-size: 12px;
              }
              th, td {
                padding: 8px;
                border: 1px solid #ddd;
                text-align: left;
              }
              .filters {
                font-size: 13px;
              }
              .statistics {
                font-size: 13px;
              }
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

            <div class="table-container page-break" style="padding: 0 20px;">
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
        Alert.alert('📄 PDF Generated', 'PDF saved successfully!');
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('❌ Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const handleBarangaySelect = (barangay) => {
    setFilterBarangay(barangay);
    setBarangayModalVisible(false);
  };

  const handleCrimeTypeSelect = (crimeType) => {
    setFilterCrimeType(crimeType);
    setCrimeTypeModalVisible(false);
  };

  const handleStatusSelect = (status) => {
    setFilterStatus(status);
    setStatusModalVisible(false);
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
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleImportFile}>
          <Text style={styles.excelIcon}>📁↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPDF}>
          <Text style={styles.pdfIcon}>📄⬇</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Barangay</Text>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setBarangayModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>{filterBarangay || 'All Barangays'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Offense</Text>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setCrimeTypeModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>{filterCrimeType || 'All Offenses'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Status</Text>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>{filterStatus || 'All Statuses'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barangay Modal */}
      <Modal
        transparent={true}
        visible={barangayModalVisible}
        animationType="fade"
        onRequestClose={() => setBarangayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Select Barangay</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => handleBarangaySelect('')}
              >
                <Text style={{ fontSize: 16, color: '#1F2937' }}>All Barangays</Text>
              </TouchableOpacity>
              {barangays.map((b, idx) => (
                <TouchableOpacity
                  key={b || `barangay-${idx}`}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => handleBarangaySelect(b)}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setBarangayModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crime Type Modal */}
      <Modal
        transparent={true}
        visible={crimeTypeModalVisible}
        animationType="fade"
        onRequestClose={() => setCrimeTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Select Offense</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => handleCrimeTypeSelect('')}
              >
                <Text style={{ fontSize: 16, color: '#1F2937' }}>All Offenses</Text>
              </TouchableOpacity>
              {crimeTypes.map((c, idx) => (
                <TouchableOpacity
                  key={c || `crimeType-${idx}`}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => handleCrimeTypeSelect(c)}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setCrimeTypeModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        transparent={true}
        visible={statusModalVisible}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>Select Status</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => handleStatusSelect('')}
              >
                <Text style={{ fontSize: 16, color: '#1F2937' }}>All Statuses</Text>
              </TouchableOpacity>
              {statuses.map((s, idx) => (
                <TouchableOpacity
                  key={s || `status-${idx}`}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => handleStatusSelect(s)}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        {filteredData.map((marker) => {
          let pinColor = 'gray';
          if ((marker.risk_level || '').toLowerCase() === 'high') pinColor = 'red';
          else if ((marker.risk_level || '').toLowerCase() === 'medium') pinColor = 'orange';
          else if ((marker.risk_level || '').toLowerCase() === 'low') pinColor = 'green';
          else if ((marker.risk_level || '').toLowerCase() === 'unknown') pinColor = '#6c757d';
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

      {/* Marker Details Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
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
  iconButton: {
    marginLeft: 10,
    backgroundColor: '#28a745',
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
  excelIcon: {
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dropdownLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: "#666",
    fontSize: 12
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff'
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14
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
  }
});