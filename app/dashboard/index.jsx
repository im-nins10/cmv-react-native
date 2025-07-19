import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import Navbar from '../../components/Navbar';
import databaseServices from '../../services/databaseServices';

const { width: screenWidth } = Dimensions.get('window');

const CrimeDashboard = () => {
  const [crimeData, setCrimeData] = useState([]);
  const [crimeRates, setCrimeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(34, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 11,
      fontFamily: 'System',
    },
    propsForBackgroundLines: {
      strokeWidth: 0, // Remove background grid lines
    },
  };

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  useEffect(() => {
    fetchCrimeData();
  }, []);

  const fetchCrimeData = async () => {
    try {
      setLoading(true);
      const data = await databaseServices.listCrimeRecords();
      if (data.error) {
        Alert.alert('Error', 'Failed to fetch crime data');
        setCrimeData([]);
        setCrimeRates([]);
      } else {
        setCrimeData(data.records || data);
        setCrimeRates(data.crimeRates || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch crime data');
      setCrimeData([]);
      setCrimeRates([]);
    } finally {
      setLoading(false);
    }
  };

  const getCrimeTypeDistribution = () => {
    const distribution = {};
    crimeData.forEach(crime => {
      if (crime.offense) {
        distribution[crime.offense] = (distribution[crime.offense] || 0) + 1;
      }
    });
    
    return Object.entries(distribution)
      .map(([offense, count], index) => ({
        name: offense.length > 12 ? offense.substring(0, 12) + '...' : offense,
        population: count,
        color: COLORS[index % COLORS.length],
        legendFontColor: '#666',
        legendFontSize: 10,
      }))
      .sort((a, b) => b.population - a.population);
  };

  const getCrimeRateByBarangay = () => {
    return crimeRates
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const getBarangayDistribution = () => {
    const distribution = {};
    crimeData.forEach(crime => {
      if (crime.barangay) {
        distribution[crime.barangay] = (distribution[crime.barangay] || 0) + 1;
      }
    });
    
    const sortedData = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
    
    return {
      labels: sortedData.map(([barangay]) => 
        barangay.length > 8 ? barangay.substring(0, 8) + '...' : barangay
      ),
      datasets: [{
        data: sortedData.map(([, count]) => count)
      }]
    };
  };

  const getCrimesOverTime = () => {
    const timeData = {};
    crimeData.forEach(crime => {
      if (crime.date_time_committed) {
        const date = new Date(crime.date_time_committed);
        const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        timeData[dateStr] = (timeData[dateStr] || 0) + 1;
      }
    });
    
    const sortedEntries = Object.entries(timeData)
      .sort(([a], [b]) => {
        const [monthA, dayA] = a.split('/').map(Number);
        const [monthB, dayB] = b.split('/').map(Number);
        return new Date(2024, monthA - 1, dayA) - new Date(2024, monthB - 1, dayB);
      })
      .slice(-15); // Last 15 days with data
    
    return {
      labels: sortedEntries.map(([date]) => date),
      datasets: [{
        data: sortedEntries.map(([, count]) => count),
        color: (opacity = 1) => `rgba(34, 150, 243, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const getTimeOfDayData = () => {
    const timeSlots = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    
    crimeData.forEach(crime => {
      if (crime.date_time_committed) {
        const hour = new Date(crime.date_time_committed).getHours();
        if (hour >= 6 && hour < 12) timeSlots.Morning++;
        else if (hour >= 12 && hour < 18) timeSlots.Afternoon++;
        else if (hour >= 18 && hour < 24) timeSlots.Evening++;
        else timeSlots.Night++;
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

  const getTopLocations = () => {
    const locationData = {};
    crimeData.forEach(crime => {
      if (crime.barangay && crime.type_of_place) {
        const key = `${crime.barangay} - ${crime.type_of_place}`;
        locationData[key] = (locationData[key] || 0) + 1;
      }
    });
    
    return Object.entries(locationData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([location, count]) => ({ 
        location: location.length > 35 ? location.substring(0, 35) + '...' : location, 
        count 
      }));
  };

  const getKeyStats = () => {
    const barangays = [...new Set(crimeData.map(c => c.barangay).filter(Boolean))];
    const crimeTypes = [...new Set(crimeData.map(c => c.offense).filter(Boolean))];
    const avgPerMonth = crimeData.length > 0 ? Math.round(crimeData.length / 12) : 0;
    const mostCommon = getCrimeTypeDistribution()[0]?.name || 'N/A';
    
    return { barangays: barangays.length, crimeTypes: crimeTypes.length, avgPerMonth, mostCommon };
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const crimeTypeData = getCrimeTypeDistribution();
  const barangayDistribution = getBarangayDistribution();
  const timeSeriesData = getCrimesOverTime();
  const timeOfDayData = getTimeOfDayData();
  const topLocations = getTopLocations();
  const keyStats = getKeyStats();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Navbar />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crime Analytics</Text>
          <Text style={styles.headerSubtitle}>{crimeData.length} Total Records</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          <TabButton title="Overview" isActive={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
          <TabButton title="Types" isActive={activeTab === 'types'} onPress={() => setActiveTab('types')} />
          <TabButton title="Locations" isActive={activeTab === 'locations'} onPress={() => setActiveTab('locations')} />
          <TabButton title="Timeline" isActive={activeTab === 'timeline'} onPress={() => setActiveTab('timeline')} />
        </ScrollView>

        <View style={styles.content}>
          {activeTab === 'overview' && (
            <View>
              {/* Key Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{keyStats.barangays}</Text>
                  <Text style={styles.statLabel}>Barangays</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{keyStats.crimeTypes}</Text>
                  <Text style={styles.statLabel}>Crime Types</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{keyStats.avgPerMonth}</Text>
                  <Text style={styles.statLabel}>Avg/Month</Text>
                </View>
              </View>

              {/* Crime Types Pie Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Crime Types</Text>
                {crimeTypeData.length > 0 ? (
                  <View style={styles.pieChartContainer}>
                    <PieChart
                      data={crimeTypeData}
                      width={screenWidth - 48}
                      height={180}
                      chartConfig={{
                        ...chartConfig,
                        propsForLabels: { fontSize: 0 }, // Hide chart labels to prevent redundancy
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="0"
                      hasLegend={false}
                      absolute={false}
                      center={[(screenWidth - 48) / 2, 90]}
                    />
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No data available</Text>
                )}
                <View style={styles.legendGrid}>
                  {crimeTypeData.map((item, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                      <Text style={styles.legendText}>{item.name} ({item.population})</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Barangay Crime Rates */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Crime Rate by Barangay</Text>
                <View style={styles.rateList}>
                  {getCrimeRateByBarangay().map((item, idx) => (
                    <View key={idx} style={styles.rateItem}>
                      <Text style={styles.rateBarangay}>{item.barangay}</Text>
                      <View style={styles.rateBarContainer}>
                        <View 
                          style={[
                            styles.rateBar, 
                            { 
                              width: `${Math.min(item.rate, 100)}%`, 
                              backgroundColor: COLORS[idx % COLORS.length] 
                            }
                          ]} 
                        />
                        <Text style={styles.rateText}>{item.rate}% ({item.count})</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'types' && (
            <View>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Crime Distribution by Barangay</Text>
                {barangayDistribution.labels.length > 0 ? (
                  <BarChart
                    data={barangayDistribution}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={chartConfig}
                    verticalLabelRotation={45}
                    showValuesOnTopOfBars
                  />
                ) : (
                  <Text style={styles.noDataText}>No data available</Text>
                )}
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Time of Day</Text>
                {timeOfDayData.labels.length > 0 ? (
                  <BarChart
                    data={timeOfDayData}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={chartConfig}
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
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Top Crime Locations</Text>
                {topLocations.length > 0 ? (
                  <View>
                    {topLocations.map((item, index) => (
                      <View key={index} style={styles.locationItem}>
                        <Text style={styles.locationText}>{item.location}</Text>
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
            </View>
          )}

          {activeTab === 'timeline' && (
            <View>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Daily Crime Trends</Text>
                {timeSeriesData.labels.length > 0 ? (
                  <LineChart
                    data={timeSeriesData}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                  />
                ) : (
                  <Text style={styles.noDataText}>No data available</Text>
                )}
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Key Insights</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryItem}>• Most Common: {keyStats.mostCommon}</Text>
                  <Text style={styles.summaryItem}>• Coverage: {keyStats.barangays} barangays</Text>
                  <Text style={styles.summaryItem}>• Daily Avg: {Math.round(crimeData.length / 30)} incidents</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  rateList: {
    marginTop: 8,
  },
  rateItem: {
    marginBottom: 12,
  },
  rateBarangay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rateBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 24,
    position: 'relative',
  },
  rateBar: {
    height: 24,
    borderRadius: 8,
    minWidth: 2,
  },
  rateText: {
    position: 'absolute',
    right: 8,
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  summaryRow: {
    gap: 4,
  },
  summaryItem: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
});

export default CrimeDashboard;