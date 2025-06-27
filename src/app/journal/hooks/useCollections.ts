import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import journalService from "@/api/services/journalService";
import { collectionTokens } from "@/api/client";
import type { Entry, Collection, JournalApiError } from "../types";

const LOCAL_STORAGE_KEY = "jurnol_collections";
const PASSWORD_STORAGE_KEY = "collection_passwords";

const defaultCollectionsData: Collection[] = [
  {
    id: "default-my-notes",
    name: "My Notes",
    entries: [], // Start with empty entries for fresh user experience
  },
  {
    id: uuidv4(), // Keep generating potential ID for default private
    name: "Private",
    isPrivate: true,
    entries: [],
  },
];

export function getDefaultCollection(): Collection {
  return { 
    id: "default-my-notes",
    name: "My Notes",
    entries: [], // Fresh start for new users
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entryCount: 0,
  };
}

/**
 * Ensures the default "My Notes" collection is always present and first
 * @param collections - Array of collections from backend
 * @returns Collections array with default collection guaranteed first
 */
function ensureDefaultCollection(collections: Collection[]): Collection[] {
  // Check if backend has a "My Notes" collection (it might have a different ID)
  const backendDefaultCollection = collections.find(col => col.name === "My Notes");
  
  if (backendDefaultCollection) {
    // Backend already has "My Notes" - ensure it's first
    const otherCollections = collections.filter(col => col.name !== "My Notes");
    return [backendDefaultCollection, ...otherCollections];
  } else {
    // No "My Notes" found - use our frontend default
    const defaultCollection = getDefaultCollection();
    return [defaultCollection, ...collections];
  }
}

/**
 * Custom hook for managing journal collections with backend integration
 * Replaces localStorage-based storage with API calls
 */
export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load collections from backend
  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await journalService.getCollections();
      
      // Load entries for each collection
      const collectionsWithEntries = await Promise.all(
        data.map(async (collection) => {
          try {
            const entries = await journalService.getEntries(collection.id);
            return { ...collection, entries };
          } catch (err) {
            // If we can't load entries (e.g., private collection), return with empty entries
            console.warn(`Failed to load entries for collection ${collection.id}:`, err);
            return { ...collection, entries: [] };
          }
        })
      );
      
      // Ensure default collection is always present and first
      const collectionsWithDefault = ensureDefaultCollection(collectionsWithEntries);
      
      setCollections(collectionsWithDefault);
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to load collections:", error);
      setError(error.message);
      
      // Fallback to just the default collection if backend is unavailable
      setCollections([getDefaultCollection()]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Verify password for private collection
  const verifyPassword = async (collectionId: string, password: string): Promise<boolean> => {
    try {
      return await journalService.verifyCollectionPassword(collectionId, password);
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Password verification failed:", error);
      return false;
    }
  };

  // Add new collection
  const addCollection = async (name: string, password?: string): Promise<boolean> => {
    try {
      console.log('🔐 Creating collection:', { name, hasPassword: !!password });
      
      const newCollection = await journalService.createCollection({
        name,
        is_private: !!password,  // ✅ Fixed: snake_case for backend
        password,
      });

      console.log('🔐 Backend returned collection:', newCollection);

      // Add to local state with entries array
      const collectionWithEntries = { ...newCollection, entries: [] };
      
      setCollections(prev => {
        // Ensure default collection stays first
        const otherCollections = prev.filter(c => c.id !== "default-my-notes");
        const defaultCollection = prev.find(c => c.id === "default-my-notes");
        
        const updated = defaultCollection 
          ? [defaultCollection, ...otherCollections, collectionWithEntries]
          : [collectionWithEntries, ...otherCollections];
          
        console.log('🔐 Updated collections:', updated.map(c => ({ id: c.id, name: c.name, isPrivate: c.isPrivate })));
        return updated;
      });
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to create collection:", error);
      setError(error.message);
      return false;
    }
  };

  // Update existing collection
  const updateCollection = async (
    collectionId: string,
    updates: { name?: string; isPrivate?: boolean; password?: string },
    currentPassword?: string
  ): Promise<boolean> => {
    try {
      const updatedCollection = await journalService.updateCollection(collectionId, {
        name: updates.name,
        is_private: updates.isPrivate,  // ✅ Convert camelCase to snake_case for backend
        password: updates.password,
        current_password: currentPassword,  // ✅ Convert camelCase to snake_case for backend
      });

      // Update local state
      setCollections(prev =>
        prev.map(col =>
          col.id === collectionId
            ? { ...col, ...updatedCollection }
            : col
        )
      );
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to update collection:", error);
      setError(error.message);
      return false;
    }
  };

  // Delete collection
  const deleteCollection = async (collectionId: string): Promise<boolean> => {
    // Find the collection to check if it's the default "My Notes"
    const collectionToDelete = collections.find(col => col.id === collectionId);
    
    // Prevent deletion of the default "My Notes" collection
    if (collectionToDelete?.name === "My Notes") {
      console.warn("Cannot delete the default 'My Notes' collection");
      setError("Cannot delete the default 'My Notes' collection");
      return false;
    }

    try {
      await journalService.deleteCollection(collectionId);
      
      // Remove access token for this collection
      collectionTokens.remove(collectionId);
      
      // Remove from local state
      setCollections(prev => prev.filter(col => col.id !== collectionId));
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to delete collection:", error);
      setError(error.message);
      return false;
    }
  };

  // Save entry to collection
  const saveEntry = async (collectionId: string, entry: Entry): Promise<boolean> => {
    try {
      let savedEntry: Entry;
      
      // Check if entry exists (update) or is new (create)
      const collection = collections.find(col => col.id === collectionId);
      const existingEntry = collection?.entries.find(e => e.id === entry.id);
      
      if (existingEntry) {
        // Update existing entry
        const updateData: any = {
          title: entry.title,
          content: entry.content,
        };
        
        // Only include is_encrypted if it's explicitly set (not undefined)
        if (entry.isEncrypted !== undefined) {
          updateData.is_encrypted = entry.isEncrypted;
        }
        
        savedEntry = await journalService.updateEntry(entry.id, updateData);
      } else {
        // Create new entry  
        const collectionIdInt = parseInt(collectionId);
        if (isNaN(collectionIdInt)) {
          throw new Error(`Invalid collection ID: ${collectionId}`);
        }
        
        const createData: any = {
          title: entry.title,
          content: entry.content,
          collection_id: collectionIdInt, // ✅ Convert to integer for backend
        };
        
        // Only include is_encrypted if it's explicitly set (not undefined)
        if (entry.isEncrypted !== undefined) {
          createData.is_encrypted = entry.isEncrypted;
        }
        
        console.log('🚀 ABOUT TO CALL createEntry with data:', createData);
        savedEntry = await journalService.createEntry(createData);
      }

      // Update local state
      setCollections(prev =>
        prev.map(col =>
          col.id === collectionId
            ? {
                ...col,
                entries: existingEntry
                  ? col.entries.map(e => e.id === entry.id ? savedEntry : e)
                  : [savedEntry, ...col.entries],
              }
            : col
        )
      );
      
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to save entry:", error);
      setError(error.message);
      return false;
    }
  };

  // Delete entry from collection
  const deleteEntry = async (collectionId: string, entryId: string): Promise<boolean> => {
    try {
      await journalService.deleteEntry(entryId);
      
      // Remove from local state
      setCollections(prev =>
        prev.map(col =>
          col.id === collectionId
            ? { ...col, entries: col.entries.filter(e => e.id !== entryId) }
            : col
        )
      );
      
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to delete entry:", error);
      setError(error.message);
      return false;
    }
  };

  // Get specific entry by ID
  const getEntry = async (entryId: string): Promise<Entry | null> => {
    try {
      return await journalService.getEntry(entryId);
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to get entry:", error);
      return null;
    }
  };

  // Refresh collections from backend
  const refreshCollections = useCallback(() => {
    loadCollections();
  }, [loadCollections]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    collections,
    isLoading,
    error,
    verifyPassword,
    addCollection,
    updateCollection,
    deleteCollection,
    saveEntry,
    deleteEntry,
    getEntry,
    refreshCollections,
    clearError,
  };
} 