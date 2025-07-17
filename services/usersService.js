import databaseServices from './databaseServices';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const collectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID;

const userService = {
  async getUsers() {
    const response = await databaseServices.listDocuments(databaseId, collectionId);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response };
  },

  async addUser(data) {
    const response = await databaseServices.createDocument(databaseId, collectionId, data);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response };
  },

  async updateUser(documentId, data) {
    const response = await databaseServices.updateDocument(databaseId, collectionId, documentId, data);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response };
  },

  async deleteUser(documentId) {
    const response = await databaseServices.deleteDocument(databaseId, collectionId, documentId);
    if (response.error) {
      return { error: response.error };
    }
    return { success: true };
  },

  async getUserByUsername(username) {
    const response = await databaseServices.listDocuments(databaseId, collectionId);
    if (response.error) {
      return { error: response.error };
    }
    const user = response.find(u => u.username === username);
    if (!user) {
      return { error: 'User not found' };
    }
    return { data: user };
  },

};

export default userService; 