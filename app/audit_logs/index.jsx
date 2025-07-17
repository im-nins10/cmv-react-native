import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import Navbar from '../../components/Navbar';

const auditLogs = [
  {
    $id: '1',
    action: 'Created User Account',
    table_affected: 'users',
    performed_by: 'Admin Mark',
    timestamp: '2025-07-13T08:30:00Z',
  },
  {
    $id: '2',
    action: 'Updated Barangay Talisay Population',
    table_affected: 'barangay',
    performed_by: 'Invest Rica',
    timestamp: '2025-07-13T10:15:00Z',
  },
  {
    $id: '3',
    action: 'Add Batch of Crime Record',
    table_affected: 'crime_records',
    performed_by: 'Admin Mark',
    timestamp: '2025-07-13T11:45:00Z',
  },
  {
    $id: '4',
    action: 'Changed Password',
    table_affected: 'users',
    performed_by: 'Invest Rica',
    timestamp: '2025-07-13T12:30:00Z',
  },
];

const AuditLogList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.table_affected.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performed_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.performed_by}</Text>
      <Text style={styles.cell}>{item.table_affected}</Text>
      <Text style={styles.cell}>{item.action}</Text>
      <Text style={styles.cell}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.heading}>Audit Logs</Text>

        <TextInput
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          placeholderTextColor="#666"
        />

        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Performed By</Text>
          <Text style={styles.headerCell}>Table</Text>
          <Text style={styles.headerCell}>Action</Text>
          <Text style={styles.headerCell}>Timestamp</Text>
        </View>

        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={styles.tableContent}
        />
      </View>
    </View>
  );
};

export default AuditLogList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf0f6', // subtle blue-gray
  },
  content: {
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#002D72', // navbar blue
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#b0c4d6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    fontSize: 14,
    color: '#002D72',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#d4e4f4',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  headerCell: {
    flex: 1,
    fontWeight: '600',
    fontSize: 13,
    color: '#002D72',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6ed',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#2c3e50',
  },
  tableContent: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
});
