import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../../components/Navbar';
import databaseServices from '../../services/databaseServices';

const { width: screenWidth } = Dimensions.get('window');

const CHART_CONFIG = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 45, 114, ${opacity})`, 
  strokeWidth: 2,
  barPercentage: 0.7,
  decimalPlaces: 0,
  propsForLabels: {
    fontSize: 10,
    fontFamily: 'System',
  },
  propsForBackgroundLines: {
    strokeWidth: 0,
  },
};

const PIE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const TIME_SLOTS = {
  'Early Morning': { start: 0, end: 6, label: '12AM-6AM' },
  'Morning': { start: 6, end: 12, label: '6AM-12PM' },
  'Afternoon': { start: 12, end: 18, label: '12PM-6PM' },
  'Evening': { start: 18, end: 24, label: '6PM-12AM' }
};

const TABS = [
  { id: 'overview', title: 'Overview' },
  { id: 'distribution', title: 'Distribution' },
  { id: 'analysis', title: 'Analysis' }
];

const CrimeDashboard = () => {
  const [crimeData, setCrimeData] = useState([]);
  const [barangayData, setBarangayData] = useState([]);
  const [crimeRiskData, setCrimeRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChartData, setSelectedChartData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({ start: null, end: null });
  const [selectedBatchNumber, setSelectedBatchNumber] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [selectedCrimeType, setSelectedCrimeType] = useState(null);
  const [crimeTypeModalVisible, setCrimeTypeModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [tempDateRange, setTempDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const crimeResponse = await databaseServices.listCrimeRecords();
      const crimes = crimeResponse.error ? [] : (crimeResponse.documents || crimeResponse.records || crimeResponse);
      setCrimeData(crimes);
      
      const barangayResponse = await databaseServices.listBarangays();
      const barangays = barangayResponse.error ? [] : (barangayResponse.documents || barangayResponse.records || barangayResponse);
      setBarangayData(barangays);
      
      const riskData = await databaseServices.getBarangayCrimeRisk();
      setCrimeRiskData(riskData);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
      setCrimeData([]);
      setBarangayData([]);
      setCrimeRiskData([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCrimeData = () => {
    return crimeData.filter(crime => {
      if (selectedDateRange.start && selectedDateRange.end) {
        const dateTime = crime.date_time_committed || crime.datetime || crime.time;
        if (!dateTime) return false;
        const crimeDate = new Date(dateTime);
        if (crimeDate < selectedDateRange.start || crimeDate > selectedDateRange.end) return false;
      }
      if (selectedBatchNumber) {
        if (crime.batch_number !== selectedBatchNumber) return false;
      }
      if (selectedBarangay) {
        const barangay = crime.barangay || crime.location;
        if (barangay !== selectedBarangay) return false;
      }
      if (selectedCrimeType) {
        const offense = crime.offense || crime.crime_type || crime.type;
        if (offense !== selectedCrimeType) return false;
      }
      return true;
    });
  };

  const handleDateRangePress = () => {
    setTempDateRange(selectedDateRange);
    setDatePickerMode('start');
    setDateRangeModalVisible(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      if (datePickerMode === 'start') {
        setTempDateRange(prev => ({ ...prev, start: selectedDate }));
        setDatePickerMode('end');
      } else {
        setTempDateRange(prev => ({ ...prev, end: selectedDate }));
      }
    }
  };

  const handleDateRangeConfirm = () => {
    setSelectedDateRange({
      start: tempDateRange.start,
      end: tempDateRange.end,
    });
    setDateRangeModalVisible(false);
    setDatePickerMode('start');
  };

  const handleDateRangeCancel = () => {
    setDateRangeModalVisible(false);
    setDatePickerMode('start');
    setTempDateRange({ start: null, end: null });
  };

  const getCrimeTypeDistribution = () => {
    const filteredData = getFilteredCrimeData();
    if (!filteredData || filteredData.length === 0) return [];
    
    const distribution = {};
    filteredData.forEach(crime => {
      const offense = crime.offense || crime.crime_type || crime.type;
      if (offense) {
        distribution[offense] = (distribution[offense] || 0) + 1;
      }
    });
    
    const totalCrimes = filteredData.length;
    return Object.entries(distribution)
      .map(([offense, count], index) => ({
        name: offense.length > 12 ? offense.substring(0, 12) + '...' : offense,
        fullName: offense,
        population: count,
        percentage: ((count / totalCrimes) * 100).toFixed(1),
        color: PIE_COLORS[index % PIE_COLORS.length],
        legendFontColor: '#666',
        legendFontSize: 10,
      }))
      .sort((a, b) => b.population - a.population);
  };

  const getRiskLevelDistribution = () => {
    let filteredRiskData = crimeRiskData;
    if (selectedBarangay) {
      filteredRiskData = crimeRiskData.filter(item => item.barangay === selectedBarangay);
    }
    if (!filteredRiskData || filteredRiskData.length === 0) return [];
    
    const riskCounts = { 'Low': 0, 'Medium': 0, 'High': 0 };
    filteredRiskData.forEach(item => {
      if (riskCounts.hasOwnProperty(item.riskLevel)) {
        riskCounts[item.riskLevel]++;
      }
    });

    const colors = { 'Low': '#4ECDC4', 'Medium': '#FFCE56', 'High': '#FF6384' };
    
    return Object.entries(riskCounts)
      .filter(([, count]) => count > 0)
      .map(([risk, count]) => ({
        name: risk,
        population: count,
        color: colors[risk],
        legendFontColor: '#666',
        legendFontSize: 12,
      }));
  };

  const getCrimeByBarangayData = () => {
    const filteredData = getFilteredCrimeData();
    const barangayData = {};
    const barangayDetails = {};
    
    filteredData.forEach(crime => {
      const barangay = crime.barangay || crime.location;
      const offense = crime.offense || crime.crime_type || crime.type;
      
      if (barangay && offense) {
        if (!barangayData[barangay]) {
          barangayData[barangay] = 0;
          barangayDetails[barangay] = {};
        }
        barangayData[barangay]++;
        barangayDetails[barangay][offense] = 
          (barangayDetails[barangay][offense] || 0) + 1;
      }
    });

    const topBarangays = Object.entries(barangayData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6);

    return {
      labels: topBarangays.map(([barangay]) => 
        barangay.length > 6 ? barangay.substring(0, 6) + '.' : barangay
      ),
      datasets: [{ 
        data: topBarangays.map(([,count]) => count),
        color: (opacity = 1) => `rgba(0, 45, 114, ${opacity})`
      }],
      details: topBarangays.reduce((acc, [barangay]) => {
        acc[barangay] = barangayDetails[barangay];
        return acc;
      }, {}),
      yAxisSuffix: ' cases'
    };
  };

  const getTimeOfDayData = () => {
    const filteredData = getFilteredCrimeData();
    const timeSlotCounts = Object.keys(TIME_SLOTS).reduce((acc, slot) => {
      acc[slot] = 0;
      return acc;
    }, {});
    
    const timeDetails = Object.keys(TIME_SLOTS).reduce((acc, slot) => {
      acc[slot] = {};
      return acc;
    }, {});
    
    filteredData.forEach(crime => {
      const dateTime = crime.date_time_committed || crime.datetime || crime.time;
      const offense = crime.offense || crime.crime_type || crime.type;
      
      if (dateTime && offense) {
        const hour = new Date(dateTime).getHours();
        Object.entries(TIME_SLOTS).forEach(([slot, { start, end }]) => {
          if (hour >= start && hour < end) {
            timeSlotCounts[slot]++;
            timeDetails[slot][offense] = (timeDetails[slot][offense] || 0) + 1;
          }
        });
      }
    });
    
    return {
      labels: Object.keys(TIME_SLOTS).map(slot => TIME_SLOTS[slot].label),
      datasets: [{ 
        data: Object.values(timeSlotCounts),
        color: (opacity = 1) => `rgba(0, 45, 114, ${opacity})`
      }],
      details: timeDetails
    };
  };

  const getDailyCrimeData = () => {
    const filteredData = getFilteredCrimeData();
    if (!filteredData || filteredData.length === 0) return { labels: [], datasets: [{ data: [] }] };

    const dailyCounts = {};
    filteredData.forEach(crime => {
      const dateTime = crime.date_time_committed || crime.datetime || crime.created_at;
      if (dateTime) {
        const date = new Date(dateTime).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dailyCounts).sort().slice(-30);
    
    return {
      labels: sortedDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{
        data: sortedDates.map(date => dailyCounts[date] || 0),
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
      }],
      details: dailyCounts
    };
  };

  const getCrimeRateByBarangayData = () => {
    let filteredRiskData = crimeRiskData;
    if (selectedBarangay) {
      filteredRiskData = filteredRiskData.filter(item => item.barangay === selectedBarangay);
    }
    if (!filteredRiskData || filteredRiskData.length === 0) {
      return { labels: [], datasets: [{ data: [] }], details: {} };
    }

    const sortedData = filteredRiskData
      .filter(item => item.crimeRate > 0)
      .sort((a, b) => b.crimeRate - a.crimeRate)
      .slice(0, 10);

    const details = {};
    sortedData.forEach(item => {
      details[item.barangay] = {
        population: item.population,
        crimeCount: item.crimeCount,
        crimeRate: item.crimeRate.toFixed(2),
        riskLevel: item.riskLevel
      };
    });

    return {
      labels: sortedData.map(item => 
        item.barangay.length > 6 ? item.barangay.substring(0, 6) + '.' : item.barangay
      ),
      datasets: [{
        data: sortedData.map(item => parseFloat(item.crimeRate.toFixed(1))),
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
      }],
      details,
      yAxisSuffix: '/1k',
      riskData: sortedData
    };
  };

  const getKeyStatistics = () => {
    const filteredCrimeData = getFilteredCrimeData();
    const filteredCrimeRiskData = selectedBarangay 
      ? crimeRiskData.filter(item => item.barangay === selectedBarangay) 
      : crimeRiskData;

    const totalCrimes = filteredCrimeData.length;
    const uniqueBarangays = [...new Set(filteredCrimeData.map(c => c.barangay || c.location).filter(Boolean))].length;
    const uniqueOffenses = [...new Set(filteredCrimeData.map(c => c.offense || c.crime_type || c.type).filter(Boolean))].length;
    const solvedCrimes = filteredCrimeData.filter(c => c.status === 'Solved' || c.status === 'Closed').length;
    const solvedRate = totalCrimes > 0 ? ((solvedCrimes / totalCrimes) * 100).toFixed(1) : '0';
    
    const avgCrimeRate = filteredCrimeRiskData.length > 0 
      ? (filteredCrimeRiskData.reduce((sum, item) => sum + item.crimeRate, 0) / filteredCrimeRiskData.length).toFixed(2)
      : '0';

    const riskLevelCounts = filteredCrimeRiskData.reduce((acc, item) => {
      acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
      return acc;
    }, { Low: 0, Medium: 0, High: 0 });
    
    return { 
      totalCrimes, 
      uniqueBarangays, 
      uniqueOffenses, 
      solvedRate, 
      avgCrimeRate,
      riskLevelCounts 
    };
  };

  const showDetailedInfo = (title, data, type) => {
    const renderText = (text, isTitle = false) => (
      <Text style={[styles.modalText, isTitle && { fontWeight: '600', marginBottom: 8 }]}>{text}</Text>
    );

    let content = null;

    if (type === 'crimetype') {
      content = (
        <>
          {renderText(title, true)}
          {data.map((item, idx) => (
            <Text key={idx} style={styles.modalText}>
              {item.fullName}: {item.population} cases ({item.percentage}%)
            </Text>
          ))}
        </>
      );
    } else if (type === 'barangay') {
      content = (
        <>
          {renderText(title, true)}
          {Object.entries(data.details).map(([barangay, crimes]) => {
            const total = Object.values(crimes).reduce((sum, count) => sum + count, 0);
            return (
              <View key={barangay} style={{ marginBottom: 8 }}>
                <Text style={[styles.modalText, { fontWeight: '600' }]}>
                  {barangay} ({total} cases):
                </Text>
                {Object.entries(crimes)
                  .sort(([,a], [,b]) => b - a)
                  .map(([crime, count]) => (
                    <Text key={crime} style={styles.modalText}>
                      • {crime}: {count}
                    </Text>
                  ))}
              </View>
            );
          })}
        </>
      );
    } else if (type === 'timeOfDay') {
      content = (
        <>
          {renderText(title, true)}
          {Object.entries(data.details).map(([timeSlot, crimes]) => {
            const total = Object.values(crimes).reduce((sum, count) => sum + count, 0);
            if (total > 0) {
              return (
                <View key={timeSlot} style={{ marginBottom: 8 }}>
                  <Text style={[styles.modalText, { fontWeight: '600' }]}>
                    {timeSlot} ({total} cases):
                  </Text>
                  {Object.entries(crimes)
                    .sort(([,a], [,b]) => b - a)
                    .map(([crime, count]) => (
                      <Text key={crime} style={styles.modalText}>
                        • {crime}: {count}
                      </Text>
                    ))}
                </View>
              );
            }
            return null;
          })}
        </>
      );
    } else if (type === 'crimeRate') {
      content = (
        <>
          {renderText(title, true)}
          {Object.entries(data.details).map(([barangay, details]) => (
            <View key={barangay} style={{ marginBottom: 8 }}>
              <Text style={[styles.modalText, { fontWeight: '600' }]}>{barangay}:</Text>
              <Text style={styles.modalText}>• Population: {details.population.toLocaleString()}</Text>
              <Text style={styles.modalText}>• Total Crimes: {details.crimeCount}</Text>
              <Text style={styles.modalText}>• Crime Rate: {details.crimeRate} per 1,000 residents</Text>
              <Text style={styles.modalText}>• Risk Level: {details.riskLevel}</Text>
            </View>
          ))}
        </>
      );
    } else if (type === 'riskLevel') {
      content = (
        <>
          {data.map((item, idx) => (
            <Text key={idx} style={styles.modalText}>
              <Text style={{ fontWeight: '600' }}>{item.name} Risk:</Text> {item.population} barangays
            </Text>
          ))}
        </>
      );
    } else if (type === 'dailyCrime') {
      content = (
        <>
          {renderText(title, true)}
          {Object.keys(data.details)
            .sort()
            .slice(-30)
            .map(date => (
              <Text key={date} style={styles.modalText}>
                {date}: {data.details[date]} cases
              </Text>
            ))}
        </>
      );
    }

    setSelectedChartData(content);
    setModalVisible(true);
  };

  // Prepare Data
  const crimeTypeData = getCrimeTypeDistribution();
  const crimeByBarangayData = getCrimeByBarangayData();
  const timeOfDayData = getTimeOfDayData();
  const dailyCrimeData = getDailyCrimeData();
  const crimeRateByBarangayData = getCrimeRateByBarangayData();
  const riskLevelData = getRiskLevelDistribution();
  const keyStats = getKeyStatistics();

  const TabButton = ({ tab, isActive, onPress }) => (
    <TouchableOpacity style={[styles.tabButton, isActive && styles.activeTab]} onPress={onPress}>
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.title}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, subtitle }) => (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ChartCard = ({ title, children, onInfoPress, onExportPDF }) => (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onInfoPress && (
            <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
              <Text style={styles.infoButtonText}>ℹ️</Text>
            </TouchableOpacity>
          )}
          {onExportPDF && (
            <TouchableOpacity style={[styles.infoButton, { marginLeft: 8 }]} onPress={onExportPDF}>
              <Text style={styles.infoButtonText}>📄</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002D72" />
        <Text style={styles.loadingText}>Loading Crime Analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Navbar />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crime Analytics Dashboard</Text>
          <Text style={styles.headerSubtitle}>{crimeData.length} Total Crime Records</Text>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date Range:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleDateRangePress}
            >
              <Text style={styles.filterButtonText}>
                {selectedDateRange.start && selectedDateRange.end
                  ? `${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`
                  : 'Select Date Range'}
              </Text>
            </TouchableOpacity>
          </View>

      {/* Date Range Modal */}
      <Modal
        transparent={true}
        visible={dateRangeModalVisible}
        animationType="fade"
        onRequestClose={handleDateRangeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.datePickerTitle, { marginBottom: 10 }]}>Select Date Range</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Start Date:</Text>
              <DateTimePicker
                value={tempDateRange.start || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={tempDateRange.end || undefined}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>End Date:</Text>
              <DateTimePicker
                value={tempDateRange.end || tempDateRange.start || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (event.type === 'set' && date) {
                    setTempDateRange(prev => ({ ...prev, end: date }));
                  }
                }}
                minimumDate={tempDateRange.start || undefined}
                maximumDate={new Date()}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity style={[styles.datePickerButton, { width: '48%' }]} onPress={handleDateRangeCancel}>
                <Text style={styles.datePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, { width: '48%', backgroundColor: '#002D72' }]}
                onPress={handleDateRangeConfirm}
                disabled={!tempDateRange.start || !tempDateRange.end}
              >
                <Text style={[styles.datePickerButtonText, { color: '#fff' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Barangay:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setBarangayModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {selectedBarangay || 'Select Barangay'}
              </Text>
            </TouchableOpacity>
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
            <Text style={[styles.datePickerTitle, { marginBottom: 10 }]}>Select Barangay</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {barangayData.map((b, idx) => (
                <TouchableOpacity
                  key={b.barangay_name + idx}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => {
                    setSelectedBarangay(b.barangay_name);
                    setBarangayModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{b.barangay_name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => {
                  setSelectedBarangay(null);
                  setBarangayModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 16, color: '#DC2626' }}>Clear Filter</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setBarangayModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Crime Type:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setCrimeTypeModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {selectedCrimeType || 'Select Crime Type'}
              </Text>
            </TouchableOpacity>
          </View>

      {/* Crime Type Modal */}
      <Modal
        transparent={true}
        visible={crimeTypeModalVisible}
        animationType="fade"
        onRequestClose={() => setCrimeTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.datePickerTitle, { marginBottom: 10 }]}>Select Crime Type</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {[...new Set(crimeData.map(c => c.offense || c.crime_type || c.type).filter(Boolean))].map((type, idx) => (
                <TouchableOpacity
                  key={type + idx}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => {
                    setSelectedCrimeType(type);
                    setCrimeTypeModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{type}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => {
                  setSelectedCrimeType(null);
                  setCrimeTypeModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 16, color: '#DC2626' }}>Clear Filter</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setCrimeTypeModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Batch Number:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setBatchModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {selectedBatchNumber || 'Select Batch'}
              </Text>
            </TouchableOpacity>
          </View>

      {/* Batch Number Modal */}
      <Modal
        transparent={true}
        visible={batchModalVisible}
        animationType="fade"
        onRequestClose={() => setBatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.datePickerTitle, { marginBottom: 10 }]}>Select Batch Number</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {[...new Set(crimeData.map(c => c.batch_number).filter(Boolean))].map((batch, idx) => (
                <TouchableOpacity
                  key={batch + idx}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => {
                    setSelectedBatchNumber(batch);
                    setBatchModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#1F2937' }}>{batch}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => {
                  setSelectedBatchNumber(null);
                  setBatchModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 16, color: '#DC2626' }}>Clear Filter</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setBatchModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

          {(selectedDateRange.start || selectedBarangay || selectedCrimeType || selectedBatchNumber) && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: '#FEE2E2' }]}
              onPress={() => {
                setSelectedDateRange({ start: null, end: null });
                setSelectedBarangay(null);
                setSelectedCrimeType(null);
                setSelectedBatchNumber(null);
              }}
            >
              <Text style={[styles.filterButtonText, { color: '#DC2626' }]}>
                Clear All Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {TABS.map(tab => (
            <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onPress={() => setActiveTab(tab.id)} />
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View>
              <View style={styles.statsRow}>
                <StatCard title="Total Crimes" value={keyStats.totalCrimes} />
                <StatCard title="Barangays" value={keyStats.uniqueBarangays} />
              </View>
              
              <View style={styles.statsRow}>
                <StatCard title="Crime Types" value={keyStats.uniqueOffenses} />
                <StatCard title="Avg Crime Rate" value={`${keyStats.avgCrimeRate}`} subtitle="per 1,000 residents" />
              </View>

              <View style={styles.statsRow}>
                <StatCard title="Case Resolution" value={`${keyStats.solvedRate}%`} subtitle="Solved Cases" />
              </View>

              <ChartCard 
                title="Number of Barangays per Risk Level"
                onInfoPress={() => showDetailedInfo('Risk Level Distribution', riskLevelData, 'riskLevel')}
              >
                <View style={styles.riskStatsContainer}>
                  <View style={{ flexDirection: 'column', gap: 12 }}>
                    <StatCard title="Low Risk" value={keyStats.riskLevelCounts.Low || 0} />
                    <StatCard title="Medium Risk" value={keyStats.riskLevelCounts.Medium || 0} />
                    <StatCard title="High Risk" value={keyStats.riskLevelCounts.High || 0} />
                  </View>
                </View>
              </ChartCard>
            </View>
          )}

          {/* DISTRIBUTION TAB */}
          {activeTab === 'distribution' && (
            <View>
              <ChartCard 
                title="Crime Type Distribution"
                onInfoPress={() => showDetailedInfo('Crime Type Breakdown', crimeTypeData, 'crimetype')}
              >
                {crimeTypeData.length > 0 ? (
                  <View>
                    <View style={styles.centeredChartContainer}>
                      <PieChart
                        data={crimeTypeData}
                        width={screenWidth - 80}
                        height={220}
                        chartConfig={{ ...CHART_CONFIG, propsForLabels: { fontSize: 0 } }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="0"
                        hasLegend={false}
                      />
                    </View>
                    <View style={styles.legendGrid}>
                      {crimeTypeData.map((item, idx) => (
                        <View key={idx} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText}>{item.name} ({item.population})</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No crime type data available</Text>
                )}
              </ChartCard>

              <ChartCard 
                title="Crime Distribution by Barangay"
                onInfoPress={() => showDetailedInfo('Crime Distribution by Barangay', crimeByBarangayData, 'barangay')}
              >
                {crimeByBarangayData.labels.length > 0 ? (
                  <BarChart
                    data={crimeByBarangayData}
                    width={screenWidth - 80}
                    height={240}
                    chartConfig={{
                      ...CHART_CONFIG,
                      formatYLabel: (value) => `${value}`
                    }}
                    yAxisSuffix=" cases"
                    verticalLabelRotation={15}
                    showValuesOnTopOfBars
                    style={styles.chart}
                  />
                ) : (
                  <Text style={styles.noDataText}>No barangay data available</Text>
                )}
              </ChartCard>

              <ChartCard 
                title="Crime Distribution by Time of Day"
                onInfoPress={() => showDetailedInfo('Crime by Time Period', timeOfDayData, 'timeOfDay')}
              >
                {timeOfDayData.labels.length > 0 ? (
                  <BarChart
                    data={timeOfDayData}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={{
                      ...CHART_CONFIG,
                      formatYLabel: (value) => `${value}`
                    }}
                    showValuesOnTopOfBars
                    style={styles.chart}
                  />
                ) : (
                  <Text style={styles.noDataText}>No time distribution data available</Text>
                )}
              </ChartCard>

              <ChartCard 
                title="Crime Distribution Over Time (Daily)"
                onInfoPress={() => showDetailedInfo('Daily Crime Trend', dailyCrimeData, 'dailyCrime')}
              >
                {dailyCrimeData.labels.length > 0 ? (
                  <LineChart
                    data={dailyCrimeData}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={{
                      ...CHART_CONFIG,
                      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                    }}
                    bezier
                    style={styles.chart}
                    formatYLabel={(value) => `${value}`}
                    yAxisSuffix=" cases"
                  />
                ) : (
                  <Text style={styles.noDataText}>No daily crime data available</Text>
                )}
              </ChartCard>
            </View>
          )}

          {/* ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <View>
              <ChartCard 
                title="Crime Rate per Barangay (per 1,000 residents)"
                onInfoPress={() => showDetailedInfo('Crime Rate Analysis', crimeRateByBarangayData, 'crimeRate')}
              >
                {crimeRateByBarangayData.labels.length > 0 ? (
                  <View>
                    <BarChart
                      data={crimeRateByBarangayData}
                      width={screenWidth - 80}
                      height={300}
                      chartConfig={{
                        ...CHART_CONFIG,
                        formatYLabel: (value) => `${value}`
                      }}
                      yAxisSuffix="/1k"
                      verticalLabelRotation={15}
                      showValuesOnTopOfBars
                      style={styles.chart}
                      fromZero
                    />
                    {crimeRateByBarangayData.riskData && (
                      <View style={styles.riskLegend}>
                        <Text style={styles.riskLegendTitle}>Risk Levels:</Text>
                        <View style={styles.riskLegendContainer}>
                          {crimeRateByBarangayData.riskData.map((item, idx) => (
                            <View key={idx} style={styles.riskLegendItem}>
                              <View style={[
                                styles.riskIndicator, 
                                { backgroundColor: 
                                  item.riskLevel === 'High' ? '#FF6384' : 
                                  item.riskLevel === 'Medium' ? '#FFCE56' : '#4ECDC4' 
                                }
                              ]} />
                              <Text style={styles.riskLegendText}>
                                {item.barangay.length > 10 ? item.barangay.substring(0, 10) + '...' : item.barangay} ({item.riskLevel})
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No crime rate data available</Text>
                )}
              </ChartCard>
            </View>
          )}
        </View>
      </ScrollView>
      
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView}>
              {selectedChartData}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#002D72', fontWeight: '500' },
  header: { backgroundColor: '#002D72', padding: 25, paddingTop: 40 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: '#B8D4FF', opacity: 0.9 },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    width: 100,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  tabContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', elevation: 2 },
  tabButton: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#002D72' },
  tabText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  activeTabText: { color: '#002D72', fontWeight: 'bold' },
  content: { padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, alignItems: 'center', flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#002D72' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#002D72', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center', fontWeight: '500' },
  statSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  chartCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  chartTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  infoButton: { backgroundColor: '#002D72', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  infoButtonText: { fontSize: 18, color: '#ffffff' },
  centeredChartContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chart: { borderRadius: 12 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F9FAFB', borderRadius: 8 },
  legendColor: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  legendText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  noDataText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, padding: 32, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 28, minWidth: 280, maxWidth: 360, maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalScrollView: { maxHeight: 300, marginBottom: 20 },
  modalText: { fontSize: 16, lineHeight: 24, color: '#1F2937', textAlign: 'left' },
  modalButton: { backgroundColor: '#002D72', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  riskStatsContainer: {
    padding: 16,
  },
  riskStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  riskLegend: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  riskLegendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  riskLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  riskLegendText: {
    fontSize: 12,
    color: '#4B5563',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  datePickerButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#002D72',
    width: '45%',
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#002D72',
    fontWeight: 'bold',
  },
});

export default CrimeDashboard;