import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Navbar from '../../components/Navbar';

const barangaysByDistrict = {
  West: [
    { name: 'Bagong Pook', population: 2098 },
    { name: 'Banay-Banay', population: 4000 },
    { name: 'Bulaklakan', population: 3200 },
    { name: 'Duhatan', population: 3200 },
    { name: 'Fernando', population: 3200 },
    { name: 'Halang', population: 3200 },
    { name: 'Mataas Na Lupa', population: 3200 },
    { name: 'Pangao', population: 3200 },
    { name: 'Pinagtongulan', population: 3200 },
    { name: 'San Carlos', population: 3200 },
    { name: 'San Salvador', population: 3200 },
    { name: 'Sico', population: 3200 },
    { name: 'Tambo', population: 3200 },
    { name: 'Tangway', population: 3200 },
    { name: 'Tibig', population: 3200 },
  ],
  Urban: [
    { name: 'Barangay 1', population: 2800 },
    { name: 'Barangay 2', population: 3200 },
    { name: 'Barangay 3', population: 3200 },
    { name: 'Barangay 4', population: 3200 },
    { name: 'Barangay 5', population: 3200 },
    { name: 'Barangay 6', population: 3200 },
    { name: 'Barangay 7', population: 3200 },
    { name: 'Barangay 8', population: 3200 },
    { name: 'Barangay 9', population: 3200 },
    { name: 'Barangay 10', population: 3200 },
    { name: 'Barangay 11', population: 3200 },
  ],
  North: [
    { name: 'Balintawak', population: 3200 },
    { name: 'Bugtong', population: 3200 },
    { name: 'Bulacnin', population: 3200 },
    { name: 'Dagatan', population: 3200 },
    { name: 'Inosluban', population: 3200 },
    { name: 'Lumbang', population: 3200 },
    { name: 'Marawoy', population: 3200 },
    { name: 'Plaridel', population: 3200 },
    { name: 'Pusil', population: 3200 },
    { name: 'San Lucas', population: 3200 },
    { name: 'Talisay', population: 3200 },
  ],
  East: [
    { name: 'Antipolo Del Norte', population: 7200 },
    { name: 'Antipolo Del Sur', population: 3200 },
    { name: 'Latag', population: 3200 },
    { name: 'Malitlit', population: 3200 },
    { name: 'Munting Pulo', population: 3200 },
    { name: 'Pinagkawitan', population: 3200 },
    { name: 'Sabang', population: 3200 },
    { name: 'San Benito', population: 3200 },
    { name: 'San Celestino', population: 3200 },
    { name: 'San Francisco', population: 3200 },
    { name: 'San Isidro', population: 3200 },
    { name: 'San Jose', population: 3200 },
    { name: 'Sto. Niño', population: 3200 },
    { name: 'Sto. Toribio', population: 3200 },
    { name: 'Tangob', population: 3200 },
    { name: 'Tipacan', population: 3200 },
  ],
  South: [
    { name: 'Adya', population: 10006 },
    { name: 'Anilao', population: 3200 },
    { name: 'Anilao Labac', population: 3200 },
    { name: 'Bolbok', population: 3200 },
    { name: 'Calamias', population: 3200 },
    { name: 'Cumba', population: 3200 },
    { name: 'Kayumanggi', population: 3200 },
    { name: 'Lodlod', population: 3200 },
    { name: 'Mabini', population: 3200 },
    { name: 'Malagonlong', population: 3200 },
    { name: 'Pagolingin Bata', population: 3200 },
    { name: 'Pagolingin East', population: 3200 },
    { name: 'Pagolingin West', population: 3200 },
    { name: 'Quezon', population: 3200 },
    { name: 'Rizal', population: 3200 },
    { name: 'Sampaguita', population: 3200 },
    { name: 'San Guillermo', population: 3200 },
  ],
};

const districts = Object.keys(barangaysByDistrict);

export default function PopulationScreen() {
  const router = useRouter();
  const [activeDistrict, setActiveDistrict] = useState('West');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editingBarangay, setEditingBarangay] = useState(null);
  const [newPopulation, setNewPopulation] = useState('');
  const pageSize = 5;

  const barangays = barangaysByDistrict[activeDistrict] || [];
  const filteredBarangays = barangays.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedBarangays = filteredBarangays.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const totalPages = Math.ceil(filteredBarangays.length / pageSize);

  return (
   <ScrollView style={styles.container}>
             <Navbar />

      {/* District Tabs */}
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

      {/* Table Rows */}
      <FlatList
        data={paginatedBarangays}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.population}</Text>
            <TouchableOpacity
              onPress={() => {
                setEditingBarangay(item);
                setNewPopulation(item.population.toString());
              }}
              style={{ flex: 1 }}
            >
              <Text style={[styles.cell, styles.editButton]}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      />

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

      {/* Edit Modal */}
      <Modal
        visible={!!editingBarangay}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBarangay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Population for {editingBarangay?.name}</Text>
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
                    `Change population of ${editingBarangay.name} to ${newPopulation}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'OK',
                        onPress: () => {
                          editingBarangay.population = parseInt(newPopulation);
                          setEditingBarangay(null);
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
    gap: 16,
    paddingLeft: 20,
  },
  navLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 4,
  },
  navLink: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    gap: 6,
    paddingHorizontal: 10,
  },
  tab: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  activeTab: {
    backgroundColor: '#0056b3',
  },
  tabText: { color: '#000' },
  activeTabText: { color: 'white', fontWeight: 'bold' },

  searchInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    margin: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dee2e6',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: 10,
  },
  headerCell: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
  },
  cell: {
    textAlign: 'center',
    paddingVertical: 10,
  },
  editButton: {
    color: '#007bff',
    fontWeight: 'bold',
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  pageButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  pageInfo: {
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '80%',
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginLeft: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
