import { storage, config } from './appwrite';
import { ID } from 'appwrite';

const storageService = {
  async uploadProfilePicture(fileUri) {
    try {
      const response = await storage.createFile(
        config.bucketId, 
        ID.unique(),
        fileUri
      );
      return response;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      return { error: error.message };
    }
  },
  getFilePreview(fileId) {
    return storage.getFilePreview(config.bucketId, fileId);
  }
};

export default storageService;