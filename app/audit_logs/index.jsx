import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Navbar from '../../components/Navbar';

const auditLogs = [
  {
    $id: '1',
    action: 'Created User Account',
    table_affected: 'users',
    performed_by: 'Admin Joy',
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
    performed_by: 'Invest Nina',
    timestamp: '2025-07-13T11:45:00Z',
  },
  {
    $id: '4',
    action: 'Changed Password',
    table_affected: 'users',
    performed_by: 'Invest Anie',
    timestamp: '2025-07-13T12:30:00Z',
  },
  {
    $id: '5',
    action: 'Deleted Crime Record',
    table_affected: 'crime_records',
    performed_by: 'Admin Joy',
    timestamp: '2025-07-12T16:20:00Z',
  },
  {
    $id: '6',
    action: 'Updated User Role',
    table_affected: 'users',
    performed_by: 'Admin Joy',
    timestamp: '2025-07-12T14:10:00Z',
  },
];

const ITEMS_PER_PAGE = 4;

const AuditLogList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_affected.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performed_by.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getActionColor = (action) => {
    if (action.toLowerCase().includes('created') || action.toLowerCase().includes('add')) {
      return '#10B981'; // Green for create/add actions
    } else if (action.toLowerCase().includes('updated') || action.toLowerCase().includes('changed')) {
      return '#F59E0B'; // Amber for update actions
    } else if (action.toLowerCase().includes('deleted')) {
      return '#EF4444'; // Red for delete actions
    } else if (action.toLowerCase().includes('failed')) {
      return '#DC2626'; // Dark red for failed actions
    }
    return '#6B7280'; // Gray for other actions
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.performerContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.performed_by.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
          <View>
            <Text style={styles.performerName}>{item.performed_by}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
        <View style={[styles.tableBadge, { backgroundColor: getTableColor(item.table_affected) }]}>
          <Text style={styles.tableBadgeText}>{item.table_affected}</Text>
        </View>
      </View>
      <View style={styles.actionContainer}>
        <View style={[styles.actionDot, { backgroundColor: getActionColor(item.action) }]} />
        <Text style={styles.actionText}>{item.action}</Text>
      </View>
    </View>
  );

  const getTableColor = (table) => {
    const colors = {
      users: '#3B82F6',
      barangay: '#8B5CF6',
      crime_records: '#F97316',
      auth_logs: '#EF4444',
    };
    return colors[table] || '#6B7280';
  };

  const renderPaginationButtons = () => {
    return (
      <View style={styles.paginationNavigation}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.paginationNavButton,
            currentPage === 1 && styles.paginationNavButtonDisabled
          ]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={[
            styles.paginationNavButtonText,
            currentPage === 1 && styles.paginationNavButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {/* Page Info */}
        <View style={styles.pageInfoContainer}>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.paginationNavButton,
            currentPage === totalPages && styles.paginationNavButtonDisabled
          ]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={[
            styles.paginationNavButtonText,
            currentPage === totalPages && styles.paginationNavButtonTextDisabled
          ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D72" />
      <Navbar />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.heading}>Audit Logs</Text>
          <Text style={styles.subtitle}>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'} found
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by action, table, or user..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchBar}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <FlatList
          data={paginatedLogs}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No audit logs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
            </View>
          }
        />

        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <View style={styles.paginationInfo}>
            </View>
            <View style={styles.paginationButtons}>
              {renderPaginationButtons()}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AuditLogList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listContainer: {
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  performerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002D72',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  tableBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  paginationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paginationInfoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  paginationNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#002D72',
    minWidth: 80,
    alignItems: 'center',
  },
  paginationNavButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paginationNavButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageInfoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  pageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});