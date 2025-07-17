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
  const pageSize = 5;

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
    <View>
      {/* District Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
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
                <Text
                  style={
                    activeDistrict === district ? styles.activeTabText : styles.tabText
                  }
                >
                  {district.toUpperCase()} DISTRICT
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search Barangay..."
        value={searchQuery}
        onChangeText={text => {
          setSearchQuery(text);
          setPage(0);
        }}
        style={styles.searchInput}
      />

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 2 }]}>Barangay</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Population</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Actions</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
        <Navbar />
      <FlatList
        data={paginatedBarangays}
        keyExtractor={item => item.$id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 2 }]}>{item.barangay_name}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.barangay_population}</Text>
            <TouchableOpacity
              onPress={() => {
                setEditingBarangay(item);
                setNewPopulation(item.barangay_population.toString());
              }}
              style={{ flex: 1 }}
            >
              <Text style={[styles.cell, styles.editButton]}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View>
            {/* Pagination */}
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 0}
                onPress={() => setPage(prev => Math.max(prev - 1, 0))}
              >
                <Text style={styles.pageButton}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>Page {page + 1} of {totalPages}</Text>
              <TouchableOpacity
                disabled={page + 1 >= totalPages}
                onPress={() => setPage(prev => prev + 1)}
              >
                <Text style={styles.pageButton}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editingBarangay}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBarangay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Population for {editingBarangay?.barangay_name}</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newPopulation}
              onChangeText={setNewPopulation}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingBarangay(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  Alert.alert(
                    'Confirm Update',
                    `Change population of ${editingBarangay.barangay_name} to ${newPopulation}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'OK',
                        onPress: async () => {
                          const res = await databaseServices.updateBarangay(editingBarangay.$id, {
                            barangay_population: parseInt(newPopulation),
                          });
                          if (!res.error) {
                            // Refresh barangays
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
                <Text style={styles.modalButtonText}>Save</Text>
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
    backgroundColor: '#f5f5f5' },

  tabsContainer: {
    marginTop: 12,
    marginBottom: 12,
  },

  tabs: {
    flexDirection: 'row',
  },
  
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    alignItems: 'center',
  },
  cell: {
    textAlign: 'center',
  },
  editButton: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  pageButton: {
    fontSize: 18,
    paddingHorizontal: 12,
    color: '#007bff',
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding:10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});