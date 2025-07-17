import React, { useState, useEffect } from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert} from 'react-native';
import { PieChart, BarChart, LineChart, ContributionGraph } from 'react-native-chart-kit';
import databaseServices from '../../services/databaseServices';
import Navbar from '../../components/Navbar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CrimeDashboard = () => {
  const [crimeData, setCrimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Responsive chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(34, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: screenWidth < 400 ? 10 : 12,
      fontFamily: 'System',
    },
  };

  // Color palette
  const COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  useEffect(() => {
    fetchCrimeData();
  }, []);

  const fetchCrimeData = async () => {
    try {
      setLoading(true);
      const data = await databaseServices.listCrimeRecords();
      if (data.error) {
        Alert.alert('Error', 'Failed to fetch crime data: ' + data.error);
        setCrimeData([]);
      } else {
        setCrimeData(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch crime data: ' + error.message);
      setCrimeData([]);
    } finally {
      setLoading(false);
    }
  };

  // Data processing functions
  const getCrimeTypeDistribution = () => {
    const distribution = {};
    crimeData.forEach(crime => {
      if (crime.offense) {
        distribution[crime.offense] = (distribution[crime.offense] || 0) + 1;
      }
    });
    
    return Object.entries(distribution)
      .map(([offense, count], index) => ({
        name: offense,
        population: count,
        color: COLORS[index % COLORS.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: screenWidth < 400 ? 10 : 12,
      }))
      .sort((a, b) => b.population - a.population);
  };

  const getCrimeDensityData = () => {
    const density = {};
    crimeData.forEach(crime => {
      if (crime.barangay) {
        const maxLength = screenWidth < 400 ? 8 : 10;
        const shortName = crime.barangay.length > maxLength ? 
          crime.barangay.substring(0, maxLength) + '...' : 
          crime.barangay;
        density[shortName] = (density[shortName] || 0) + 1;
      }
    });
    
    const labels = Object.keys(density);
    const data = Object.values(density);
    
    return {
      labels,
      datasets: [{
        data,
        colors: labels.map((_, index) => () => COLORS[index % COLORS.length])
      }]
    };
  };

  const getCrimesOverTime = () => {
    const timeData = {};
    crimeData.forEach(crime => {
      if (crime.date_time_committed) {
        const date = new Date(crime.date_time_committed);
        const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
        timeData[monthYear] = (timeData[monthYear] || 0) + 1;
      }
    });
    
    const sortedEntries = Object.entries(timeData)
      .sort(([a], [b]) => {
        const [monthA, yearA] = a.split('/');
        const [monthB, yearB] = b.split('/');
        return new Date(`20${yearA}`, monthA - 1) - new Date(`20${yearB}`, monthB - 1);
      })
      .slice(-12); // Last 12 months
    
    return {
      labels: sortedEntries.map(([date]) => date),
      datasets: [{
        data: sortedEntries.map(([, count]) => count),
        color: (opacity = 1) => `rgba(34, 150, 243, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const getTimeOfDayDistribution = () => {
    const timeSlots = screenWidth < 400 ? {
      'Morn\n(6-12)': 0,
      'Aft\n(12-18)': 0,
      'Eve\n(18-24)': 0,
      'Ngt\n(0-6)': 0
    } : {
      'Morning\n(6-12)': 0,
      'Afternoon\n(12-18)': 0,
      'Evening\n(18-24)': 0,
      'Night\n(0-6)': 0
    };
    
    crimeData.forEach(crime => {
      if (crime.date_time_committed) {
        const date = new Date(crime.date_time_committed);
        const hour = date.getHours();
        
        if (hour >= 6 && hour < 12) {
          timeSlots[screenWidth < 400 ? 'Morn\n(6-12)' : 'Morning\n(6-12)']++;
        } else if (hour >= 12 && hour < 18) {
          timeSlots[screenWidth < 400 ? 'Aft\n(12-18)' : 'Afternoon\n(12-18)']++;
        } else if (hour >= 18 && hour < 24) {
          timeSlots[screenWidth < 400 ? 'Eve\n(18-24)' : 'Evening\n(18-24)']++;
        } else {
          timeSlots[screenWidth < 400 ? 'Ngt\n(0-6)' : 'Night\n(0-6)']++;
        }
      }
    });
    
    return {
      labels: Object.keys(timeSlots),
      datasets: [{
        data: Object.values(timeSlots),
        colors: Object.keys(timeSlots).map((_, index) => () => COLORS[index % COLORS.length])
      }]
    };
  };

  const getCrimeTypeByBarangay = () => {
    const barangayData = {};
    const offenseSet = new Set();
    
    crimeData.forEach(crime => {
      if (crime.barangay && crime.offense) {
        const maxLength = screenWidth < 400 ? 6 : 8;
        const shortBarangay = crime.barangay.length > maxLength ? 
          crime.barangay.substring(0, maxLength) + '...' : 
          crime.barangay;
        
        if (!barangayData[shortBarangay]) {
          barangayData[shortBarangay] = {};
        }
        barangayData[shortBarangay][crime.offense] = (barangayData[shortBarangay][crime.offense] || 0) + 1;
        offenseSet.add(crime.offense);
      }
    });
    
    return { barangayData, offenses: Array.from(offenseSet) };
  };

  const getTopCrimeLocations = () => {
    const locationData = {};
    crimeData.forEach(crime => {
      if (crime.barangay && crime.type_of_place) {
        const key = `${crime.barangay} - ${crime.type_of_place}`;
        locationData[key] = (locationData[key] || 0) + 1;
      }
    });
    
    return Object.entries(locationData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  };

  const getDataSummary = () => {
    const barangays = [...new Set(crimeData.map(c => c.barangay).filter(Boolean))];
    const crimeTypes = [...new Set(crimeData.map(c => c.offense).filter(Boolean))];
    const placeTypes = [...new Set(crimeData.map(c => c.type_of_place).filter(Boolean))];
    const classifications = [...new Set(crimeData.map(c => c.classification_of_crime).filter(Boolean))];
    
    return { barangays, crimeTypes, placeTypes, classifications };
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading crime data...</Text>
      </View>
    );
  }

  const crimeTypeData = getCrimeTypeDistribution();
  const densityData = getCrimeDensityData();
  const timeSeriesData = getCrimesOverTime();
  const timeOfDayData = getTimeOfDayDistribution();
  const { barangayData, offenses } = getCrimeTypeByBarangay();
  const topLocations = getTopCrimeLocations();
  const dataSummary = getDataSummary();

  const DataDescription = ({ title, items, maxItems = 5 }) => (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionTitle}>{title}:</Text>
      <View style={styles.descriptionItems}>
        {items.slice(0, maxItems).map((item, index) => (
          <View key={index} style={styles.descriptionItem}>
            <Text style={styles.descriptionText}>• {item}</Text>
          </View>
        ))}
        {items.length > maxItems && (
          <Text style={styles.moreText}>... and {items.length - maxItems} more</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Navbar />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crime Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>Total Records: {crimeData.length}</Text>
      </View>

      {/* Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TabButton
          title="Overview"
          isActive={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <TabButton
          title="Crime Types"
          isActive={activeTab === 'types'}
          onPress={() => setActiveTab('types')}
        />
        <TabButton
          title="Locations"
          isActive={activeTab === 'locations'}
          onPress={() => setActiveTab('locations')}
        />
        <TabButton
          title="Timeline"
          isActive={activeTab === 'timeline'}
          onPress={() => setActiveTab('timeline')}
        />
        <TabButton
          title="Analysis"
          isActive={activeTab === 'analysis'}
          onPress={() => setActiveTab('analysis')}
        />
      </ScrollView>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <View>
            {/* Crime Type Distribution */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Crime Type Distribution</Text>
              <DataDescription 
                title="Crime Types in Dataset" 
                items={dataSummary.crimeTypes}
                maxItems={6}
              />
              {crimeTypeData.length > 0 ? (
                <PieChart
                  data={crimeTypeData}
                  width={screenWidth - (screenWidth < 400 ? 24 : 32)}
                  height={screenWidth < 400 ? 180 : 220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>

            {/* Crime Density */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Crime Density by Barangay</Text>
              <DataDescription 
                title="Barangays in Dataset" 
                items={dataSummary.barangays}
                maxItems={5}
              />
              {densityData.labels.length > 0 ? (
                <BarChart
                  data={densityData}
                  width={screenWidth - (screenWidth < 400 ? 24 : 32)}
                  height={screenWidth < 400 ? 180 : 220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={screenWidth < 400 ? 60 : 45}
                  showValuesOnTopOfBars
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'types' && (
          <View>
            {/* Crime Type Bar Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Crime Types Distribution</Text>
              <DataDescription 
                title="Top Crime Types" 
                items={crimeTypeData.slice(0, 6).map(item => `${item.name} (${item.population} cases)`)}
                maxItems={6}
              />
              {crimeTypeData.length > 0 ? (
                <BarChart
                  data={{
                    labels: crimeTypeData.slice(0, 6).map(item => {
                      const maxLength = screenWidth < 400 ? 6 : 8;
                      return item.name.length > maxLength ? item.name.substring(0, maxLength) + '...' : item.name;
                    }),
                    datasets: [{
                      data: crimeTypeData.slice(0, 6).map(item => item.population)
                    }]
                  }}
                  width={screenWidth - (screenWidth < 400 ? 24 : 32)}
                  height={screenWidth < 400 ? 180 : 220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={screenWidth < 400 ? 60 : 45}
                  showValuesOnTopOfBars
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>

            {/* Time of Day Distribution */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Time of Day Distribution</Text>
              <DataDescription 
                title="Time Periods Analyzed" 
                items={[
                  "Morning (6:00 AM - 12:00 PM)",
                  "Afternoon (12:00 PM - 6:00 PM)", 
                  "Evening (6:00 PM - 12:00 AM)",
                  "Night (12:00 AM - 6:00 AM)"
                ]}
                maxItems={4}
              />
              {timeOfDayData.labels.length > 0 ? (
                <BarChart
                  data={timeOfDayData}
                  width={screenWidth - (screenWidth < 400 ? 24 : 32)}
                  height={screenWidth < 400 ? 180 : 220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={screenWidth < 400 ? 30 : 45}
                  showValuesOnTopOfBars
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'locations' && (
          <View>
            {/* Top Crime Locations */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top Crime Locations</Text>
              <DataDescription 
                title="Place Types in Dataset" 
                items={dataSummary.placeTypes}
                maxItems={5}
              />
              {topLocations.length > 0 ? (
                <View style={styles.listContainer}>
                  {topLocations.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listItemText}>{item.location}</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{item.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>

            {/* Barangay Summary */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Barangay Crime Summary</Text>
              <DataDescription 
                title="Crime Classifications" 
                items={dataSummary.classifications}
                maxItems={4}
              />
              <View style={styles.summaryContainer}>
                {Object.entries(barangayData).map(([barangay, crimes]) => (
                  <View key={barangay} style={styles.summaryItem}>
                    <Text style={styles.summaryTitle}>{barangay}</Text>
                    <Text style={styles.summaryCount}>
                      Total: {Object.values(crimes).reduce((a, b) => a + b, 0)}
                    </Text>
                    <Text style={styles.summaryDetail}>
                      Top: {Object.entries(crimes).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'timeline' && (
          <View>
            {/* Crimes Over Time */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Crimes Over Time</Text>
              <DataDescription 
                title="Time Period Analysis" 
                items={[
                  `Data spans from ${crimeData.length > 0 ? new Date(Math.min(...crimeData.map(c => new Date(c.date_time_committed || 0)))).toLocaleDateString() : 'N/A'}`,
                  `to ${crimeData.length > 0 ? new Date(Math.max(...crimeData.map(c => new Date(c.date_time_committed || 0)))).toLocaleDateString() : 'N/A'}`,
                  `Showing monthly crime trends`,
                  `Total incidents: ${crimeData.length}`
                ]}
                maxItems={4}
              />
              {timeSeriesData.labels.length > 0 ? (
                <LineChart
                  data={timeSeriesData}
                  width={screenWidth - (screenWidth < 400 ? 24 : 32)}
                  height={screenWidth < 400 ? 180 : 220}
                  chartConfig={chartConfig}
                  bezier
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'analysis' && (
          <View>
            {/* Statistical Summary */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Statistical Summary</Text>
              <DataDescription 
                title="Dataset Overview" 
                items={[
                  `${dataSummary.barangays.length} Barangays covered`,
                  `${dataSummary.crimeTypes.length} Different crime types`,
                  `${dataSummary.placeTypes.length} Types of places`,
                  `${dataSummary.classifications.length} Crime classifications`
                ]}
                maxItems={4}
              />
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{crimeData.length}</Text>
                  <Text style={styles.statLabel}>Total Crimes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{new Set(crimeData.map(c => c.barangay)).size}</Text>
                  <Text style={styles.statLabel}>Barangays</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{new Set(crimeData.map(c => c.offense)).size}</Text>
                  <Text style={styles.statLabel}>Crime Types</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{new Set(crimeData.map(c => c.type_of_place)).size}</Text>
                  <Text style={styles.statLabel}>Place Types</Text>
                </View>
              </View>
            </View>

            {/* Most Common Offenses */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Most Common Offenses</Text>
              <DataDescription 
                title="Top 5 Crime Types with Details" 
                items={crimeTypeData.slice(0, 5).map(item => `${item.name}: ${item.population} cases (${((item.population / crimeData.length) * 100).toFixed(1)}%)`)}
                maxItems={5}
              />
              {crimeTypeData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.offenseItem}>
                  <View style={[styles.offenseColor, { backgroundColor: item.color }]} />
                  <Text style={styles.offenseText}>{item.name}</Text>
                  <Text style={styles.offenseCount}>{item.population}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: screenWidth < 400 ? 14 : 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: screenWidth < 400 ? 16 : 20,
    paddingTop: screenWidth < 400 ? 40 : 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: screenWidth < 400 ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: screenWidth < 400 ? 24 : 28,
  },
  headerSubtitle: {
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: screenWidth < 400 ? 8 : 0,
  },
  tabButton: {
    paddingHorizontal: screenWidth < 400 ? 12 : 20,
    paddingVertical: screenWidth < 400 ? 12 : 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: screenWidth < 400 ? 2 : 0,
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    padding: screenWidth < 400 ? 12 : 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: screenWidth < 400 ? 12 : 16,
    marginBottom: screenWidth < 400 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: screenWidth < 400 ? 12 : 16,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: screenWidth < 400 ? 14 : 16,
    padding: screenWidth < 400 ? 15 : 20,
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: screenWidth < 400 ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemText: {
    flex: 1,
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#333',
    lineHeight: screenWidth < 400 ? 16 : 18,
  },
  countBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: screenWidth < 400 ? 24 : 28,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: screenWidth < 400 ? 10 : 12,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryItem: {
    width: screenWidth < 400 ? '100%' : '48%',
    backgroundColor: '#f8f9fa',
    padding: screenWidth < 400 ? 10 : 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCount: {
    fontSize: screenWidth < 400 ? 10 : 12,
    color: '#666',
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: screenWidth < 400 ? 9 : 10,
    color: '#888',
    marginTop: 2,
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: screenWidth < 400 ? 10 : 12,
    borderRadius: 6,
    marginBottom: screenWidth < 400 ? 10 : 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  descriptionTitle: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionItems: {
    paddingLeft: 8,
  },
  descriptionItem: {
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: screenWidth < 400 ? 10 : 12,
    color: '#555',
    lineHeight: screenWidth < 400 ? 14 : 16,
  },
  moreText: {
    fontSize: screenWidth < 400 ? 9 : 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    flexWrap: screenWidth < 400 ? 'wrap' : 'nowrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: screenWidth < 400 ? '45%' : 'auto',
    marginBottom: screenWidth < 400 ? 10 : 0,
  },
  statNumber: {
    fontSize: screenWidth < 400 ? 20 : 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: screenWidth < 400 ? 10 : 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  offenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: screenWidth < 400 ? 6 : 8,
  },
  offenseColor: {
    width: screenWidth < 400 ? 12 : 16,
    height: screenWidth < 400 ? 12 : 16,
    borderRadius: screenWidth < 400 ? 6 : 8,
    marginRight: screenWidth < 400 ? 8 : 12,
  },
  offenseText: {
    flex: 1,
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#333',
    lineHeight: screenWidth < 400 ? 16 : 18,
  },
  offenseCount: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default CrimeDashboard;