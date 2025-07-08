import { Client, Databases} from 'appwrite';

const config = {
    endPoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT, 
    projectID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    db: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
    col: {
        users: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID,
    },
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID, 
};

const client = new Client()
    .setEndpoint(config.endPoint)
    .setProject(config.projectID);

// Removed setPlatform block

const database = new Databases(client);


export { database, config, client };