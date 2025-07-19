import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Modal, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import databaseServices from '../../services/databaseServices';
import Navbar from '../../components/Navbar';

export default function PopulationScreen() {
  const router = useRouter();
  const [barangays, setBarangays] = useState([]);
  const [activeDistrict, setActiveDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editingBarangay, setEditingBarangay] = useState(null);
  const [newPopulation, setNewPopulation] = useState('');
  const pageSize = 6;

  // Fetch barangays from Appwrite
  useEffect(() => {
    const fetchBarangays = async () => {
      const res = await databaseServices.listBarangays();
      if (res.error) {
        setBarangays([]);
      } else {
        setBarangays(res);
        if (res.length > 0 && !activeDistrict) {
          setActiveDistrict(res[0].barangay_district);
        }
      }
    };
    fetchBarangays();
  }, []);

  // Group barangays by district
  const barangaysByDistrict = useMemo(() => {
    const grouped = {};
    barangays.forEach(b => {
      if (!grouped[b.barangay_district]) grouped[b.barangay_district] = [];
      grouped[b.barangay_district].push(b);
    });
    return grouped;
  }, [barangays]);

  const districts = Object.keys(barangaysByDistrict);
  const barangaysInDistrict = barangaysByDistrict[activeDistrict] || [];
  const filteredBarangays = barangaysInDistrict.filter(
    b =>
      typeof b.barangay_name === 'string' &&
      b.barangay_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedBarangays = filteredBarangays.slice(
    page * pageSize,
    (page + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredBarangays.length / pageSize);

  // Header renderer
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* District Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {districts.map(district => (
            <TouchableOpacity
              key={district}
              style={[styles.tab, activeDistrict === district && styles.activeTab]}
              onPress={() => {
                setActiveDistrict(district);
                setSearchQuery('');
                setPage(0);
              }}
            >
              <Text style={[styles.tabText, activeDistrict === district && styles.activeTabText]}>
                {district.toUpperCase()} DISTRICT
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search Barangay..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            setPage(0);
          }}
          style={styles.searchInput}
        />
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.tableRow, index === paginatedBarangays.length - 1 && styles.lastRow]}>
      <View style={styles.barangayInfo}>
        <Text style={styles.barangayName}>{item.barangay_name}</Text>
        <Text style={styles.populationNumber}>{item.barangay_population.toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setEditingBarangay(item);
          setNewPopulation(item.barangay_population.toString());
        }}
        style={styles.editButton}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Navbar />
      
      <View style={styles.content}>
        {renderHeader()}
        
        {/* Data Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Barangay Population</Text>
            <Text style={styles.headerSubtext}>
              {filteredBarangays.length} barangay{filteredBarangays.length !== 1 ? 's' : ''} found
            </Text>
          </View>

          <FlatList
            data={paginatedBarangays}
            keyExtractor={item => item.$id}
            renderItem={renderItem}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No barangays found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
              </View>
            }
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 0}
                onPress={() => setPage(prev => Math.max(prev - 1, 0))}
                style={[styles.pageButton, page === 0 && styles.disabledButton]}
              >
                <Text style={[styles.pageButtonText, page === 0 && styles.disabledText]}>Previous</Text>
              </TouchableOpacity>
              
              <View style={styles.pageIndicator}>
                <Text style={styles.pageInfo}>Page {page + 1} of {totalPages}</Text>
              </View>
              
              <TouchableOpacity
                disabled={page + 1 >= totalPages}
                onPress={() => setPage(prev => prev + 1)}
                style={[styles.pageButton, page + 1 >= totalPages && styles.disabledButton]}
              >
                <Text style={[styles.pageButtonText, page + 1 >= totalPages && styles.disabledText]}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={!!editingBarangay}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBarangay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Population</Text>
            <Text style={styles.modalSubtitle}>{editingBarangay?.barangay_name}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Population Count</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={newPopulation}
                onChangeText={setNewPopulation}
                placeholder="Enter population"
                placeholderTextColor="#8E8E93"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingBarangay(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  Alert.alert(
                    'Confirm Update',
                    `Change population of ${editingBarangay.barangay_name} to ${parseInt(newPopulation).toLocaleString()}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Update',
                        onPress: async () => {
                          const res = await databaseServices.updateBarangay(editingBarangay.$id, {
                            barangay_population: parseInt(newPopulation),
                          });
                          if (!res.error) {
                            const updated = await databaseServices.listBarangays();
                            setBarangays(updated);
                            setEditingBarangay(null);
                          } else {
                            Alert.alert('Error', res.error);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: '#002D72',
    shadowColor: '#002D72',
    shadowOpacity: 0.3,
  },
  tabText: {
    color: '#1C1C1E',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  barangayInfo: {
    flex: 1,
  },
  barangayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  populationNumber: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#002D72',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#002D72',
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F2F2F7',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledText: {
    color: '#8E8E93',
  },
  pageIndicator: {
    paddingHorizontal: 16,
  },
  pageInfo: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#002D72',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});