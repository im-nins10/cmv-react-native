import { storage, config } from './appwrite';
import { ID } from 'appwrite';

const storageService = {
  async uploadProfilePicture(fileUri) {
    try {
      // Fetch the file as a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();
      // Create a File object (name can be anything, e.g., 'profile.jpg')
      const file = new File([blob], 'profile.jpg', { type: blob.type });

      // Upload to Appwrite Storage
      const uploaded = await storage.createFile(
        config.bucketId,
        ID.unique(),
        file
      );
      return uploaded;
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