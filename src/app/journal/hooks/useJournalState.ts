import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { 
  Collection, 
  DeleteConfirmation, 
  DropdownState, 
  PasswordPrompt, 
  CollectionFormData 
} from "../types";
import { useCollections } from "./useCollections";

/**
 * Main hook for managing journal state and operations
 * Centralizes all journal-related state management and business logic
 */
export function useJournalState() {
  const router = useRouter();
  const {
    collections,
    isLoading: collectionsLoading,
    error: collectionsError,
    addCollection,
    updateCollection,
    deleteCollection,
    deleteEntry,
    verifyPassword,
    refreshCollections,
    clearError,
  } = useCollections();

  // UI State
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<DropdownState | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPrompt | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  // Form States
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    isPrivate: false,
    password: "",
    currentPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);

  // Set default collection when collections load
  useEffect(() => {
    if (collections.length > 0 && !collectionsLoading) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol && (!selectedCollectionId || !collections.find(c => c.id === selectedCollectionId))) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, selectedCollectionId, collectionsLoading]);

  // Helper function to check if collection name exists
  const checkNameExists = useCallback((name: string, excludeId?: string) => {
    return collections.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || c.id !== excludeId)
    );
  }, [collections]);

  // Computed properties
  const selectedCollection = collections.find(c => c.id === selectedCollectionId) || null;
  
  const displayedEntries = selectedCollection ? 
    selectedCollection.entries.filter(entry => 
      !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

  const totalEntries = collections.reduce((total, col) => total + col.entries.length, 0);
  const nameExists = formData.name ? checkNameExists(formData.name, editingCollection?.id) : false;

  // Collection Operations
  const handleAddNewCollection = () => {
    setFormData({ name: "", isPrivate: false, password: "", currentPassword: "" });
    setEditingCollection(null);
    setPasswordError("");
    setIsModalOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      isPrivate: collection.isPrivate || false,
      password: "",
      currentPassword: ""
    });
    setPasswordError("");
    setIsModalOpen(true);
  };

  const handleCreateCollection = async () => {
    if (!formData.name.trim()) return;

    setOperationLoading(true);
    try {
      console.log('🔐 Creating collection with form data:', {
        name: formData.name,
        isPrivate: formData.isPrivate,
        hasPassword: !!formData.password,
        passwordLength: formData.password?.length
      });

      let success = false;
      if (editingCollection) {
        // Update existing collection
        success = await updateCollection(
          editingCollection.id,
          {
            name: formData.name,
            isPrivate: formData.isPrivate,
            password: formData.password || undefined,
          },
          formData.currentPassword || undefined
        );
      } else {
        // Create new collection  
        const password = formData.isPrivate && formData.password ? formData.password : undefined;
        console.log('🔐 Calling addCollection with password:', !!password);
        success = await addCollection(formData.name, password);
      }

      if (success) {
        console.log('✅ Collection operation successful');
        handleCloseModal();
        
        // Auto-select the new collection if it was created
        if (!editingCollection) {
          // Find the newly created collection
          const newCollection = collections.find(c => c.name === formData.name);
          if (newCollection) {
            console.log('🎯 Auto-selecting new collection:', newCollection.id);
            setSelectedCollectionId(newCollection.id);
          }
        }
      } else {
        console.error('❌ Collection operation failed');
      }
    } catch (error) {
      console.error('💥 Collection creation/update error:', error);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", isPrivate: false, password: "", currentPassword: "" });
    setPasswordError("");
    setEditingCollection(null);
    setOperationLoading(false);
  };

  // Entry Operations
  const handleAddNewEntry = () => {
    if (!selectedCollectionId) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (!defaultCol) {
        alert("Please create a collection first");
        return;
      }
      router.push(`/journal/entry?collection=${defaultCol.id}`);
    } else {
      router.push(`/journal/entry?collection=${selectedCollectionId}`);
    }
  };

  const handleEditEntry = (entryId: string) => {
    router.push(`/journal/entry?id=${entryId}&collection=${selectedCollectionId}`);
  };

  // Collection Selection with Password Check
  const handleCollectionSelect = async (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    
    console.log('🔐 DEBUG: Collection selection:', {
      collectionId,
      collection: collection ? {
        id: collection.id,
        name: collection.name,
        isPrivate: collection.isPrivate,
        entriesCount: collection.entries?.length || 0
      } : null,
      allCollections: collections.map(c => ({ 
        id: c.id, 
        name: c.name, 
        isPrivate: c.isPrivate,
        typeof_isPrivate: typeof c.isPrivate
      }))
    });
    
    if (collection?.isPrivate) {
      console.log('🔐 DEBUG: Collection is private, showing password prompt');
      setPasswordPrompt({ collectionId, name: collection.name });
    } else {
      console.log('🔐 DEBUG: Collection is public or isPrivate is falsy, selecting directly');
      setSelectedCollectionId(collectionId);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordPrompt) return;
    
    console.log('🔐 Starting password verification for collection:', passwordPrompt.collectionId);
    console.log('🔐 Password length:', enteredPassword?.length);
    
    setOperationLoading(true);
    try {
      const success = await verifyPassword(passwordPrompt.collectionId, enteredPassword);
      console.log('🔐 Password verification result:', success);
      
      if (success) {
        console.log('✅ Password correct, refreshing collections and selecting');
        // Refresh collections to load entries for the unlocked collection
        await refreshCollections();
        
        setSelectedCollectionId(passwordPrompt.collectionId);
        setPasswordPrompt(null);
        setEnteredPassword("");
      } else {
        console.log('❌ Password incorrect');
        alert("Incorrect password. Please try again.");
      }
    } catch (error: any) {
      console.error("💥 Password verification error:", error);
      
      // Show more specific error messages
      if (error?.message?.includes('Network Error') || error?.isNetworkError) {
        alert("Cannot connect to server. Please check your connection and try again.");
      } else if (error?.message?.includes('timeout')) {
        alert("Request timed out. Please try again.");
      } else if (error?.status === 404) {
        alert("Collection not found. Please refresh the page and try again.");
      } else {
        alert(`Password verification failed: ${error?.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const handleClosePasswordPrompt = () => {
    setPasswordPrompt(null);
    setEnteredPassword("");
  };

  // Delete Operations
  const handleDeleteEntry = (entryId: string) => {
    if (!selectedCollectionId) return;
    const selectedCollection = collections.find(c => c.id === selectedCollectionId);
    const entry = selectedCollection?.entries.find(e => e.id === entryId);
    setDeleteConfirmation({
      type: 'entry',
      id: entryId,
      name: entry?.title || 'Untitled'
    });
  };

  const handleDeleteCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    setDeleteConfirmation({
      type: 'collection',
      id: collectionId,
      name: collection?.name || 'Unknown Collection'
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    setOperationLoading(true);
    try {
      let success = false;
      
      if (deleteConfirmation.type === 'entry') {
        success = await deleteEntry(selectedCollectionId!, deleteConfirmation.id);
      } else {
        success = await deleteCollection(deleteConfirmation.id);
        
        // If deleted collection was selected, switch to default
        if (success && deleteConfirmation.id === selectedCollectionId) {
          const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
          setSelectedCollectionId(defaultCol?.id || null);
        }
      }

      if (success) {
        setDeleteConfirmation(null);
      } else {
        alert(`Failed to delete ${deleteConfirmation.type}. Please try again.`);
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      alert(`Failed to delete ${deleteConfirmation.type}. Please try again.`);
    } finally {
      setOperationLoading(false);
    }
  };

  // Error handling
  const handleClearError = () => {
    clearError();
  };

  // Helper function for merging form data
  const updateFormData = useCallback((updates: Partial<CollectionFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      console.log('📝 Form data updated:', {
        name: updated.name,
        isPrivate: updated.isPrivate,
        hasPassword: !!updated.password,
        passwordLength: updated.password?.length,
        hasCurrentPassword: !!updated.currentPassword
      });
      
      // Clear password error when switching to public
      if (updates.isPrivate === false) {
        setPasswordError("");
      }
      
      // Clear password error when password is entered
      if (updates.password && passwordError) {
        setPasswordError("");
      }
      
      return updated;
    });
  }, [passwordError]);

  return {
    // State
    collections,
    selectedCollectionId,
    selectedCollection,
    displayedEntries,
    searchQuery,
    openDropdown,
    isModalOpen,
    passwordPrompt,
    enteredPassword,
    deleteConfirmation,
    editingCollection,
    formData,
    passwordError,
    totalEntries,
    nameExists,
    
    // Loading and Error States
    collectionsLoading,
    collectionsError,
    operationLoading,

    // Actions
    setSearchQuery,
    setOpenDropdown,
    setEnteredPassword,
    updateFormData,
    handleAddNewCollection,
    handleEditCollection,
    handleCreateCollection,
    handleCloseModal,
    handleAddNewEntry,
    handleEditEntry,
    handleCollectionSelect,
    handlePasswordSubmit,
    handleClosePasswordPrompt,
    handleDeleteEntry,
    handleDeleteCollection,
    confirmDelete,
    setDeleteConfirmation,
    handleClearError,
  };
} 