"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Calendar, Lock, FileText, X, Lightbulb, Heart, BarChart3 } from "lucide-react";
import { useCollections, Entry, Collection } from "./collection";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import DropdownMenu from "@/components/DropdownMenu";
import PageTransition from '@/components/PageTransition';

function getTimeAgo(isoString: string | undefined): string {
  if (!isoString) return "Never";
  const now = new Date();
  const saved = new Date(isoString);
  const diff = Math.floor((now.getTime() - saved.getTime()) / 1000);
  const minutes = Math.floor(diff / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Update the Modal component
const Modal = ({ isOpen, onClose, onSubmit, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" aria-hidden="true" />
      <div 
        className="bg-gray-800 text-white rounded-lg shadow-xl w-[400px] p-6 border border-gray-600 relative transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors transform hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const Journal: React.FC = () => {
  const router = useRouter();
  const {
    collections,
    addCollection,
    deleteCollection,
    deleteEntry,
    verifyPassword,
    updateCollection,
  } = useCollections();

  // Add new state variables for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, forceUpdate] = useState(0);
  const [passwordPrompt, setPasswordPrompt] = useState<{ collectionId: string; name: string } | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'entry' | 'collection';
    id: string;
    name?: string;
  } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<{
    type: 'entry' | 'collection';
    id: string;
    rect: DOMRect | null;
    collection?: Collection;
    entry?: Entry;
  } | null>(null);

  // New state for gratitude entries
  const [gratitudes, setGratitudes] = useState([
    { id: 1, text: "Grateful for a productive morning and good coffee", date: "Today" },
    { id: 2, text: "Thankful for my supportive team", date: "Yesterday" },
    { id: 3, text: "Appreciated the peaceful evening walk", date: "2 days ago" },
  ]);
  const [newGratitude, setNewGratitude] = useState("");
  const [isAddingGratitude, setIsAddingGratitude] = useState(false);

  // Writing prompts data
  const writingPrompts = [
    "What am I most grateful for today?",
    "What challenge did I overcome?",
    "How did I grow today?",
    "What brought me joy?",
    "What would I like to improve tomorrow?"
  ];

  // Add function to check if name exists
  const checkNameExists = (name: string, excludeId?: string) => {
    return collections.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || c.id !== excludeId)
    );
  };

  useEffect(() => {
    if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol && (!selectedCollectionId || !collections.find(c => c.id === selectedCollectionId))) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, selectedCollectionId]);

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

  const handleAddNewCollection = () => {
    setNewCollectionName(""); // Reset the input
    setIsModalOpen(true); // Open the modal
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setIsPrivate(collection.isPrivate || false);
    setPassword("");
    setCurrentPassword("");
    setPasswordError("");
    setIsModalOpen(true);
  };

  const handleCreateCollection = async () => {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName || checkNameExists(trimmedName, editingCollection?.id)) {
      return;
    }

    if (editingCollection) {
      // Update existing collection
      const success = await updateCollection(
        editingCollection.id,
        {
          name: trimmedName,
          isPrivate: isPrivate,
          password: isPrivate ? password : undefined
        },
        editingCollection.isPrivate ? currentPassword : undefined
      );

      if (!success) {
        setPasswordError("Invalid current password or invalid new password format");
        return;
      }
    } else {
      // Create new collection
      if (isPrivate && !password.match(/^[a-zA-Z0-9]+$/)) {
        setPasswordError("Password must contain only letters and numbers");
        return;
      }
      await addCollection(trimmedName, isPrivate ? password : undefined);
    }

    setSelectedCollectionId(editingCollection?.id || collections[collections.length - 1]?.id || null);
    setIsModalOpen(false);
    setNewCollectionName("");
    setIsPrivate(false);
    setPassword("");
    setCurrentPassword("");
    setPasswordError("");
    setEditingCollection(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedCollectionId) return;
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

  const handleEditEntry = (entryId: string) => {
    router.push(`/journal/entry?id=${entryId}&collection=${selectedCollectionId}`);
  };

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

  const handleAddGratitude = () => {
    if (newGratitude.trim()) {
      const newEntry = {
        id: gratitudes.length + 1,
        text: newGratitude.trim(),
        date: "Today"
      };
      setGratitudes([newEntry, ...gratitudes]);
      setNewGratitude("");
      setIsAddingGratitude(false);
    }
  };

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);
  const displayedEntries = selectedCollection?.entries
    ?.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof entry.content === 'string' && entry.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
     || [];

  // Calculate journal stats
  const totalEntries = collections.reduce((sum, col) => sum + (col.entries?.length || 0), 0);
  const totalGratitudes = gratitudes.length;

  return (
    <PageTransition>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="max-w-full mx-auto px-6">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-3">Journal</h1>
            <p className="text-lg text-gray-300">Record your thoughts, experiences, and insights</p>
          </div>
          
          {/* Main Layout - Three Columns using Flexbox */}
          <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
            
            {/* Left Column - Main Journal Content */}
            <div className="flex-1 xl:flex-[2] max-w-none">
              <div className="mb-8">
                <div 
                  className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-6 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                >
                  <div className="flex items-center space-x-2 border border-gray-600 rounded-lg p-2 bg-gray-700/50 overflow-x-auto mb-4 lg:mb-0 lg:mr-4 flex-1">
                    {collections.map(col => (
                      <div
                        key={col.id}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-lg flex items-center gap-2 text-base font-medium transition-all duration-200 ease-in-out cursor-pointer relative transform hover:scale-105 ${
                          selectedCollectionId === col.id
                            ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/50'
                            : 'text-gray-300 hover:bg-gray-600/50'
                          }`}
                        onClick={() => handleCollectionSelect(col.id)}
                      >
                        <div className="flex items-center gap-2 pointer-events-none">
                          {col.isPrivate ? <Lock size={18} /> : <FileText size={18} />}
                          <span className="truncate max-w-[180px]">{col.name}</span>
                        </div>
                        {col.name !== "My Notes" && (
                          <div className="ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(`<<< CLICK Collection Edit Icon for: ${col.name} (${col.id}) >>>`);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const nextState = openDropdown?.id === col.id ? null : { type: 'collection' as const, id: col.id, rect: rect, collection: col };
                                console.log(`<<< Setting openDropdown to:`, nextState);
                                setOpenDropdown(nextState);
                              }}
                              className="text-gray-400 hover:text-blue-400 transition-all duration-200 p-1 rounded-full hover:bg-gray-600/50 transform hover:scale-110"
                              title="Edit Collection"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {collections.length === 0 && (
                      <span className="px-5 py-2.5 text-base text-gray-400 italic">No collections yet.</span>
                    )}
                  </div>

                  <button
                    onClick={handleAddNewCollection}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-gray-500 rounded-lg text-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105"
                    title="Add New Collection"
                  >
                    <Plus size={18} /> Add a Collection
                  </button>
                </div>

                <div 
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                >
                  <div className="relative flex-1 max-w-md">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Search in ${selectedCollection?.name || 'all notes'}...`}
                      className="w-full pl-12 pr-5 py-3 border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200 ease-in-out"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={!selectedCollection}
                    />
                  </div>

                  <button
                    onClick={handleAddNewEntry}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-base font-medium"
                    title="Add New Entry"
                    disabled={!selectedCollectionId}
                  >
                    <Plus size={20} /> New Entry
                  </button>
                </div>
              </div>

              {/* Entries Grid */}
              <div 
                className={`${
                  displayedEntries.length > 12 
                    ? 'max-h-[1000px] overflow-y-auto pr-2' 
                    : ''
                }`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 #1F2937'
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #1F2937;
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #4B5563;
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #6B7280;
                  }
                `}</style>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedEntries.map((entry) => {
                    let previewText = 'No content preview available';
                    if (typeof entry.content === 'string') {
                      const cleanText = entry.content.replace(/<[^>]+>/g, '');
                      if (cleanText.length <= 100) {
                        previewText = cleanText;
                      } else {
                        // Find the last space within or near the 100 character limit
                        const truncated = cleanText.substring(0, 100);
                        const lastSpaceIndex = truncated.lastIndexOf(' ');
                        
                        if (lastSpaceIndex > 80) { // Only use space if it's not too far back
                          previewText = cleanText.substring(0, lastSpaceIndex) + '...';
                        } else {
                          // If no suitable space found, look a bit further
                          const extended = cleanText.substring(0, 120);
                          const nextSpaceIndex = extended.indexOf(' ', 100);
                          if (nextSpaceIndex !== -1 && nextSpaceIndex < 120) {
                            previewText = cleanText.substring(0, nextSpaceIndex) + '...';
                          } else {
                            previewText = truncated + '...';
                          }
                        }
                      }
                    }
                    const entryDate = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date';

                    return (
                      <div 
                        key={entry.id} 
                        className="p-6 rounded-xl shadow-lg border border-gray-600 flex flex-col justify-between transition-all duration-300 hover:shadow-xl transform hover:scale-105 cursor-pointer min-h-[200px]"
                        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                        onClick={() => handleEditEntry(entry.id)}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-white break-words">{entry.title || "Untitled"}</h3>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown?.id === entry.id ? null : { type: 'entry' as const, id: entry.id, rect: e.currentTarget.getBoundingClientRect(), collection: selectedCollection, entry: entry });
                                }}
                                className="text-gray-400 hover:text-blue-400 transition-all duration-200 ease-in-out transform hover:scale-110"
                                title="Edit Entry"
                              >
                                <Edit size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="text-base text-gray-300 mb-4 break-words leading-relaxed">
                            {previewText}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-auto pt-4 border-t border-gray-600">
                          <Calendar size={16} className="mr-2 flex-shrink-0" />
                          <span>{entryDate}</span>
                          <span className="ml-auto text-sm text-gray-500">{getTimeAgo(entry.lastSavedAt)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {selectedCollectionId && displayedEntries.length === 0 && (
                    <div 
                      className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                    >
                      <p className="text-xl mb-3">This collection is empty{searchQuery ? ' for your current search' : ''}.</p>
                      <p className="text-base">Click "New Entry" to add a note!</p>
                    </div>
                  )}
                  {!selectedCollectionId && collections.length > 0 && (
                     <div 
                       className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                       style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                     >
                        <p className="text-xl mb-3">Select a collection from the tabs above to view entries.</p>
                     </div>
                  )}
                  {collections.length === 0 && (
                     <div 
                       className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                       style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                     >
                        <p className="text-xl mb-3">You don't have any collections yet.</p>
                        <p className="text-base">Click "Add a Collection" to get started!</p>
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Writing Prompts, Gratitude Log & Stats */}
            <div className="flex-1 xl:max-w-sm space-y-8">
              {/* Writing Prompts Section */}
              <div 
                className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="text-yellow-400" size={24} />
                  <h2 className="text-xl font-semibold text-white">Writing Prompts</h2>
                </div>
                <div className="space-y-4">
                  {writingPrompts.map((prompt, index) => (
                    <div key={index} className="text-base text-gray-300 hover:text-white transition-colors cursor-pointer py-3 px-4 rounded-lg hover:bg-gray-700/50 border border-transparent hover:border-gray-600">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gratitude Log Section */}
              <div 
                className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="text-red-400" size={24} />
                  <h2 className="text-xl font-semibold text-white">Gratitude Log</h2>
                </div>
                <div className="space-y-4 mb-6">
                  {gratitudes.slice(0, 4).map((gratitude) => (
                    <div key={gratitude.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
                      <p className="text-base text-gray-300 mb-2 leading-relaxed">{gratitude.text}</p>
                      <span className="text-sm text-gray-500">{gratitude.date}</span>
                    </div>
                  ))}
                </div>
                {isAddingGratitude ? (
                  <div className="space-y-3">
                    <textarea
                      value={newGratitude}
                      onChange={(e) => setNewGratitude(e.target.value)}
                      placeholder="What are you grateful for?"
                      className="w-full p-4 text-base bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddGratitude}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingGratitude(false);
                          setNewGratitude("");
                        }}
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingGratitude(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 text-base font-medium"
                  >
                    <Plus size={18} />
                    Add Gratitude
                  </button>
                )}
              </div>

              {/* Journal Stats Section */}
              <div 
                className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="text-green-400" size={24} />
                  <h2 className="text-xl font-semibold text-white">Journal Stats</h2>
                </div>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">15</div>
                    <div className="text-base text-gray-400">Day Streak</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">{totalEntries}</div>
                      <div className="text-sm text-gray-400">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">{totalGratitudes}</div>
                      <div className="text-sm text-gray-400">Gratitudes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Update Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setNewCollectionName("");
              setIsPrivate(false);
              setPassword("");
              setCurrentPassword("");
              setPasswordError("");
              setEditingCollection(null);
            }}
            onSubmit={handleCreateCollection}
            title={editingCollection ? "Edit Collection" : "Create New Collection"}
          >
            <div>
              <label htmlFor="collectionName" className="block text-sm font-medium text-gray-300 mb-2">
                Collection Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="collectionName"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCollectionName.trim() && !checkNameExists(newCollectionName.trim(), editingCollection?.id)) {
                      handleCreateCollection();
                    }
                  }}
                  placeholder="Enter collection name..."
                  className={`w-full pl-3 pr-10 py-2 border rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    newCollectionName.trim() && checkNameExists(newCollectionName.trim(), editingCollection?.id)
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-600'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 transform hover:scale-110 ${
                    isPrivate 
                      ? 'text-blue-400 hover:text-blue-300 bg-blue-500/20'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                  }`}
                  title={isPrivate ? "Private Collection" : "Public Collection"}
                >
                  <Lock size={16} />
                </button>
              </div>
              {editingCollection?.isPrivate && (
                <div className="mt-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              )}
              {isPrivate && (
                <div className="mt-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    {editingCollection ? "New Password (leave blank to keep current)" : "Password"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingCollection ? "Enter new password..." : "Enter password..."}
                    className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              )}
              {passwordError && (
                <p className="mt-2 text-sm text-red-400">
                  {passwordError}
                </p>
              )}
              {/* Validation Message */}
              {newCollectionName.trim() && checkNameExists(newCollectionName.trim(), editingCollection?.id) && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                  This collection name already exists
                </p>
              )}
              {/* Privacy Info */}
              <p className="mt-2 text-xs text-gray-400">
                {isPrivate 
                  ? "This collection will be private and password protected (letters and numbers only)"
                  : "This collection will be visible to everyone"}
              </p>
            </div>
          </Modal>

          {/* Password Prompt Modal */}
          <Modal
            isOpen={!!passwordPrompt}
            onClose={() => {
              setPasswordPrompt(null);
              setEnteredPassword("");
            }}
            onSubmit={handlePasswordSubmit}
            title={`Enter Password for ${passwordPrompt?.name}`}
          >
            <div>
              <label htmlFor="collectionPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="collectionPassword"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
          </Modal>

          {/* Add delete confirmation dialog */}
          <ConfirmationDialog
            isOpen={!!deleteConfirmation}
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={confirmDelete}
            title={`Delete ${deleteConfirmation?.type === 'entry' ? 'Note' : 'Collection'}`}
            message={`Are you sure you want to delete "${deleteConfirmation?.name}"? This action cannot be undone.`}
          />

          {/* RENDER DROPDOWN OUTSIDE the scroll container */}
          {openDropdown && openDropdown.rect && (
            <div
              className="fixed z-[1000]"
              style={{
                left: `${openDropdown.rect.left}px`,
                top: `${openDropdown.rect.bottom + window.scrollY + 4}px`,
              }}
            >
              <DropdownMenu
                onEdit={(e) => {
                  e?.stopPropagation(); 
                  if (openDropdown.type === 'collection' && openDropdown.collection) {
                    handleEditCollection(openDropdown.collection);
                  } else if (openDropdown.type === 'entry' && openDropdown.entry) {
                    handleEditEntry(openDropdown.id);
                  }
                  setOpenDropdown(null);
                }}
                onDelete={(e) => {
                  e?.stopPropagation();
                  if (openDropdown.type === 'collection') {
                    handleDeleteCollection(openDropdown.id);
                  } else if (openDropdown.type === 'entry') {
                    handleDeleteEntry(openDropdown.id);
                  }
                  setOpenDropdown(null);
                }}
                className="shadow-xl"
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Journal;
