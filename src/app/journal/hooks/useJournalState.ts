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
    addCollection,
    deleteCollection,
    deleteEntry,
    verifyPassword,
    updateCollection,
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

  // Set default collection when collections load
  useEffect(() => {
    if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol && (!selectedCollectionId || !collections.find(c => c.id === selectedCollectionId))) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, selectedCollectionId]);

  // Helper function to check if collection name exists
  const checkNameExists = useCallback((name: string, excludeId?: string) => {
    return collections.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || c.id !== excludeId)
    );
  }, [collections]);

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
    const trimmedName = formData.name.trim();
    if (!trimmedName || checkNameExists(trimmedName, editingCollection?.id)) {
      return;
    }

    if (editingCollection) {
      // Update existing collection
      const success = await updateCollection(
        editingCollection.id,
        {
          name: trimmedName,
          isPrivate: formData.isPrivate,
          password: formData.isPrivate ? formData.password : undefined
        },
        editingCollection.isPrivate ? formData.currentPassword : undefined
      );

      if (!success) {
        setPasswordError("Invalid current password or invalid new password format");
        return;
      }
    } else {
      // Create new collection
      if (formData.isPrivate && !formData.password.match(/^[a-zA-Z0-9]+$/)) {
        setPasswordError("Password must contain only letters and numbers");
        return;
      }
      await addCollection(trimmedName, formData.isPrivate ? formData.password : undefined);
    }

    // Select the newly created/updated collection
    setSelectedCollectionId(editingCollection?.id || collections[collections.length - 1]?.id || null);
    
    // Reset modal state
    setIsModalOpen(false);
    setFormData({ name: "", isPrivate: false, password: "", currentPassword: "" });
    setPasswordError("");
    setEditingCollection(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", isPrivate: false, password: "", currentPassword: "" });
    setPasswordError("");
    setEditingCollection(null);
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
    if (collection?.isPrivate) {
      setPasswordPrompt({ collectionId, name: collection.name });
    } else {
      setSelectedCollectionId(collectionId);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordPrompt) return;
    
    const success = await verifyPassword(passwordPrompt.collectionId, enteredPassword);
    if (success) {
      setSelectedCollectionId(passwordPrompt.collectionId);
      setPasswordPrompt(null);
      setEnteredPassword("");
    } else {
      alert("Incorrect password");
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

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === 'entry') {
      deleteEntry(selectedCollectionId!, deleteConfirmation.id);
    } else {
      deleteCollection(deleteConfirmation.id);
      if (selectedCollectionId === deleteConfirmation.id) {
        setSelectedCollectionId(collections.length > 1 ? collections.find(c => c.id !== deleteConfirmation.id)?.id || null : null);
      }
    }
    setDeleteConfirmation(null);
  };

  // Computed Values
  const selectedCollection = collections.find(c => c.id === selectedCollectionId) || null;
  const displayedEntries = selectedCollection?.entries
    ?.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof entry.content === 'string' && entry.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
     || [];

  const totalEntries = collections.reduce((sum, col) => sum + (col.entries?.length || 0), 0);
  const nameExists = checkNameExists(formData.name.trim(), editingCollection?.id);

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

    // Actions
    setSearchQuery,
    setOpenDropdown,
    setEnteredPassword,
    setFormData: (updates: Partial<CollectionFormData>) => 
      setFormData(prev => ({ ...prev, ...updates })),
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
    setDeleteConfirmation
  };
} 