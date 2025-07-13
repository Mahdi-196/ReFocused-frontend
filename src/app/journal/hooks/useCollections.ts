import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import journalService from "@/api/services/journalService";
import { collectionTokens } from "@/api/client";
import type { Entry, Collection, JournalApiError } from "../types";

/**
 * Ensures the default "My Notes" collection is always present and first
 * @param collections - Array of collections from backend
 * @returns Collections array with default collection guaranteed first
 */
function ensureDefaultCollection(collections: Collection[]): Collection[] {
  // Check if backend has a "My Notes" collection
  const backendDefaultCollection = collections.find(col => col.name === "My Notes");
  
  if (backendDefaultCollection) {
    // Backend already has "My Notes" - ensure it's first
    const otherCollections = collections.filter(col => col.name !== "My Notes");
    return [backendDefaultCollection, ...otherCollections];
  } else {
    // No "My Notes" found - create a default one (this will be created on backend later)
    const defaultCollection: Collection = {
      id: 0, // Temporary ID, will be assigned by backend
      name: "My Notes",
      is_private: false,
      entries: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entry_count: 0,
      // Frontend-friendly aliases
      isPrivate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryCount: 0,
    };
    return [defaultCollection, ...collections];
  }
}

/**
 * Custom hook for managing journal collections with backend integration
 * Handles collections, entries, and all related operations
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
      
      // Check if "My Notes" collection exists, create it if not
      let collectionsData = data;
      const hasDefaultCollection = data.some(col => col.name === "My Notes");
      
      if (!hasDefaultCollection) {
        console.log('📝 Creating default "My Notes" collection...');
        try {
          const defaultCollection = await journalService.createCollection({
            name: "My Notes",
            is_private: false,
          });
          collectionsData = [defaultCollection, ...data];
          console.log('✅ Default collection created:', defaultCollection);
        } catch (createError) {
          console.warn('⚠️ Failed to create default collection, using fallback:', createError);
        }
      }
      
      // Load entries for each collection
      const collectionsWithEntries = await Promise.all(
        collectionsData.map(async (collection) => {
          try {
            const entries = await journalService.getEntries(collection.id.toString());
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
      const defaultCollection: Collection = {
        id: 0,
        name: "My Notes",
        is_private: false,
        entries: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entry_count: 0,
        isPrivate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entryCount: 0,
      };
      setCollections([defaultCollection]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Refresh collections (public method)
  const refreshCollections = useCallback(() => {
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
        is_private: !!password,
        password,
      });

      console.log('🔐 Backend returned collection:', newCollection);

      // Add to local state with entries array
      const collectionWithEntries = { ...newCollection, entries: [] };
      
      setCollections(prev => {
        // Ensure default collection stays first
        const otherCollections = prev.filter(c => c.name !== "My Notes");
        const defaultCollection = prev.find(c => c.name === "My Notes");
        
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
        is_private: updates.isPrivate,
        password: updates.password,
        current_password: currentPassword,
        new_password: updates.password, // Backend expects new_password for password changes
      });

      // Update local state
      setCollections(prev =>
        prev.map(col =>
          col.id.toString() === collectionId
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
    const collectionToDelete = collections.find(col => col.id.toString() === collectionId);
    
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
      setCollections(prev => prev.filter(col => col.id.toString() !== collectionId));
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
      const collection = collections.find(col => col.id.toString() === collectionId);
      if (!collection) {
        console.error('❌ Collection not found:', collectionId);
        setError(`Collection not found: ${collectionId}`);
        return false;
      }
      
      const existingEntry = collection.entries.find(e => e.id === entry.id);
      
      if (existingEntry) {
        // Update existing entry
        const updateData = {
          title: entry.title,
          content: entry.content,
          is_encrypted: entry.is_encrypted,
        };
        
        console.log('📝 Updating entry:', entry.id, 'in collection:', collectionId);
        savedEntry = await journalService.updateEntry(entry.id, updateData);
      } else {
        // Create new entry
        const collectionIdInt = parseInt(collectionId);
        if (isNaN(collectionIdInt)) {
          console.error('❌ Invalid collection ID format:', collectionId);
          setError(`Invalid collection ID: ${collectionId}`);
          return false;
        }
        
        const createData = {
          title: entry.title,
          content: entry.content,
          collection_id: collectionIdInt,
          is_encrypted: entry.is_encrypted,
        };
        
        console.log('📝 Creating new entry in collection:', collectionIdInt, 'with data:', createData);
        savedEntry = await journalService.createEntry(createData);
        console.log('✅ Entry created successfully:', savedEntry.id);
      }

      // Update local state
      setCollections(prev =>
        prev.map(col =>
          col.id.toString() === collectionId
            ? {
                ...col,
                entries: existingEntry
                  ? col.entries.map(e => e.id === entry.id ? savedEntry : e)
                  : [...col.entries, savedEntry],
                entry_count: (col.entry_count || 0) + (existingEntry ? 0 : 1),
                entryCount: (col.entryCount || 0) + (existingEntry ? 0 : 1),
              }
            : col
        )
      );
      
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("❌ Failed to save entry:", error);
      console.error("❌ Collection ID:", collectionId);
      console.error("❌ Entry data:", entry);
      
      // Provide more specific error messages
      if (error.message?.includes('collection')) {
        setError(`Collection error: ${error.message}`);
      } else if (error.message?.includes('validation')) {
        setError(`Validation error: ${error.message}`);
      } else {
        setError(`Failed to save entry: ${error.message}`);
      }
      return false;
    }
  };

  // Delete entry from collection
  const deleteEntry = async (collectionId: string, entryId: string): Promise<boolean> => {
    try {
      await journalService.deleteEntry(entryId);
      
      // Update local state
      setCollections(prev =>
        prev.map(col =>
          col.id.toString() === collectionId
            ? {
                ...col,
                entries: col.entries.filter(e => e.id !== entryId),
                entry_count: Math.max(0, (col.entry_count || 1) - 1),
                entryCount: Math.max(0, (col.entryCount || 1) - 1),
              }
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

  // Get entry by ID
  const getEntry = async (entryId: string): Promise<Entry | null> => {
    try {
      return await journalService.getEntry(entryId);
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to get entry:", error);
      // Don't set general error state for individual entry fetches
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    collections,
    isLoading,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    saveEntry,
    deleteEntry,
    getEntry,
    verifyPassword,
    refreshCollections,
    clearError,
  };
} 