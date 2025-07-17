import { database, config } from './appwrite';
import { Query, ID } from 'appwrite';

const databaseServices = {
  async listDocuments(databaseId, collectionId, queries = []) {
    try {
      const response = await database.listDocuments(databaseId, collectionId, queries);
      return response.documents || [];
    } catch (error) {
      console.error('Error listing documents:', error); // Log full error
      return { error: error.message };
    }
  },

  async createDocument(databaseId, collectionId, data) {
    try {
      const response = await database.createDocument(databaseId, collectionId, ID.unique(), data);
      return response;
    } catch (error) {
      console.error('Error creating document:', error);
      return { error: error.message };
    }
  },

  async updateDocument(databaseId, collectionId, documentId, data) {
    try {
      const response = await database.updateDocument(databaseId, collectionId, documentId, data);
      return response;
    } catch (error) {
      console.error('Error updating document:', error);
      return { error: error.message };
    }
  },

  async deleteDocument(databaseId, collectionId, documentId) {
    try {
      await database.deleteDocument(databaseId, collectionId, documentId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { error: error.message };
    }
  },

  // --- Barangay-specific helpers ---
  async listBarangays() {
    return await databaseServices.listDocuments(config.db, config.col.barangay, [
      Query.limit(100)  // Adjust this number if you have more than 100
    ]);
  },

  async updateBarangay(documentId, data) {
    return await databaseServices.updateDocument(config.db, config.col.barangay, documentId, data);
  },

  // --- Crime Records helpers ---
  async listCrimeRecords() {
    return await databaseServices.listDocuments(config.db, config.col.crime_records, [
      Query.limit(100)
    ]);
  },

  async insertAuditLog({ action, table_affected, timestamp }) {
    try {
      const data = {
        action,
        table_affected,
        timestamp,
      };
      const response = await database.createDocument(config.db, config.col.audit_logs, ID.unique(), data);
      return response;
    } catch (error) {
      console.error('Error inserting audit log:', error);
      return { error: error.message };
    }
  },

  async listAuditLogs() {
    return await databaseServices.listDocuments(config.db, config.col.audit_logs, [
      Query.limit(100)
    ]);
  },
};

export default databaseServices;
