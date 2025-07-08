import { database } from './appwrite';

const databaseServices = {
  async listDocuments(databaseId, collectionId) {
    try {
      const response = await database.listDocuments(databaseId, collectionId);
      return response.documents || [];
    } catch (error) {
      console.error('Error listing documents:', error.message);
      return { error: error.message };
    }
  },

  async createDocument(databaseId, collectionId, data) {
    try {
      const response = await database.createDocument(databaseId, collectionId, 'unique()', data);
      return response;
    } catch (error) {
      console.error('Error creating document:', error.message);
      return { error: error.message };
    }
  },

  async updateDocument(databaseId, collectionId, documentId, data) {
    try {
      const response = await database.updateDocument(databaseId, collectionId, documentId, data);
      return response;
    } catch (error) {
      console.error('Error updating document:', error.message);
      return { error: error.message };
    }
  },

  async deleteDocument(databaseId, collectionId, documentId) {
    try {
      await database.deleteDocument(databaseId, collectionId, documentId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error.message);
      return { error: error.message };
    }
  },
};

export default databaseServices;