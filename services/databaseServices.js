import { ID, Query } from 'appwrite';
import { config, database } from './appwrite';

import { kmeans } from 'ml-kmeans';

const databaseServices = {
  /**
   * Computes crime rate per barangay, clusters barangays into risk levels using KMeans, and returns risk levels.
   * Returns: [{ barangay, population, crimeCount, crimeRate, riskLevel }]
   */
  async getBarangayCrimeRisk() {
    // Fetch barangays (with population)
    const barangays = await databaseServices.listBarangays();
    // Fetch all crime records
    const crimes = await databaseServices.listCrimeRecords();

    // Map barangay crime counts (normalize names)
    const crimeCounts = {};
    crimes.forEach((crime) => {
      const b = (crime.barangay || '').trim().toLowerCase();
      if (!crimeCounts[b]) crimeCounts[b] = 0;
      crimeCounts[b]++;
    });

    // Prepare data for clustering (normalize names, use correct attributes)
    const barangayData = barangays.map((b) => {
      const barangayKey = (b.barangay_name || '').trim().toLowerCase();
      const population = Number(b.barangay_population) || 1; // Avoid division by zero
      const crimeCount = crimeCounts[barangayKey] || 0;
      const crimeRate = (crimeCount / population) * 1000 ;
      return {
        barangay: b.barangay_name,
        population,
        crimeCount,
        crimeRate,
        district: b.barangay_district,
      };
    });

    // KMeans clustering (3 clusters: low, medium, high risk)
    const rates = barangayData.map((d) => [d.crimeRate]);
    let kmeansResult;
    try {
      kmeansResult = kmeans(rates, 3);
    } catch (err) {
      console.error('KMeans error:', err);
      return barangayData.map((d) => ({ ...d, riskLevel: 'unknown' }));
    }

    // Assign risk levels based on cluster centroids
    // Sort centroids: lowest = low, highest = high
    const centroids = kmeansResult.centroids.map((c) => c[0]);
    const sorted = [...centroids].sort((a, b) => a - b);
    function getRiskLabel(clusterIdx) {
      const centroid = centroids[clusterIdx];
      if (centroid === sorted[0]) return 'Low';
      if (centroid === sorted[1]) return 'Medium';
      return 'High';
    }

    return barangayData.map((d, i) => ({
      ...d,
      riskLevel: getRiskLabel(kmeansResult.clusters[i]),
    }));
  },
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
