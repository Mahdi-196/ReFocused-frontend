"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Calendar, Lock, FileText, Trash2, X } from "lucide-react";
import { useCollections, Entry, Collection } from "./collection";

const TextEditor = dynamic(() => import("@/components/TextEditor"), {
  ssr: false,
});

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

async function exportToPDF(html: string, title: string) {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.innerHTML = html;

  const opt = {
    margin: 0.5,
    filename: `${title || "journal"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  html2pdf().set(opt).from(container).save();
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
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" aria-hidden="true" />
      <div 
        className="bg-white rounded-lg shadow-xl w-[400px] p-6 border border-gray-200 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
    saveEntry,
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
  const [_, forceUpdate] = useState(0);
  const [passwordPrompt, setPasswordPrompt] = useState<{ collectionId: string; name: string } | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
      router.push(`/journal/new?collection=${defaultCol.id}`);
    } else {
      router.push(`/journal/new?collection=${selectedCollectionId}`);
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
    deleteEntry(selectedCollectionId, entryId);
    forceUpdate(n => n + 1);
  };

  const handleEditEntry = (entryId: string) => {
    console.log("Edit entry clicked:", entryId);
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
    
    const isValid = await verifyPassword(passwordPrompt.collectionId, enteredPassword);
    if (isValid) {
      setSelectedCollectionId(passwordPrompt.collectionId);
      setPasswordPrompt(null);
      setEnteredPassword("");
    } else {
      alert("Incorrect password");
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

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 border border-gray-300 rounded-md p-1 bg-white overflow-x-auto max-w-[calc(100%-200px)]">
            {collections.map(col => (
              <div
                key={col.id}
                className={`flex-shrink-0 px-4 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ease-in-out cursor-pointer ${
                  selectedCollectionId === col.id
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                onClick={() => handleCollectionSelect(col.id)}
              >
                {col.isPrivate ? <Lock size={16} /> : <FileText size={16} />}
                <span className="truncate max-w-[150px]">{col.name}</span>
                {col.name !== "My Notes" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCollection(col);
                    }}
                    className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit Collection"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>
            ))}
            {collections.length === 0 && (
              <span className="px-4 py-1.5 text-sm text-gray-500 italic">No collections yet.</span>
            )}
          </div>

          <button
            onClick={handleAddNewCollection}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors duration-150 ease-in-out"
            title="Add New Collection"
          >
            <Plus size={16} /> Add a Collection
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-1/3 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search in ${selectedCollection?.name || 'all notes'}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-150 ease-in-out"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedCollection}
            />
          </div>

          <button
            onClick={handleAddNewEntry}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add New Entry"
            disabled={!selectedCollectionId}
          >
            <Plus size={18} /> New Entry
          </button>
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
          <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 ${
                newCollectionName.trim() && checkNameExists(newCollectionName.trim(), editingCollection?.id)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors duration-150 ${
                isPrivate 
                  ? 'text-blue-600 hover:text-blue-700 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
              }`}
              title={isPrivate ? "Private Collection" : "Public Collection"}
            >
              <Lock size={16} />
            </button>
          </div>
          {editingCollection?.isPrivate && (
            <div className="mt-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {isPrivate && (
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {editingCollection ? "New Password (leave blank to keep current)" : "Password"}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingCollection ? "Enter new password..." : "Enter password..."}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {passwordError && (
            <p className="mt-2 text-sm text-red-600">
              {passwordError}
            </p>
          )}
          {/* Validation Message */}
          {newCollectionName.trim() && checkNameExists(newCollectionName.trim(), editingCollection?.id) && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
              This collection name already exists
            </p>
          )}
          {/* Privacy Info */}
          <p className="mt-2 text-xs text-gray-500">
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
          <label htmlFor="collectionPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="collectionPassword"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
          />
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedEntries.map((entry) => {
          const previewText = typeof entry.content === 'string' ? entry.content.replace(/<[^>]+>/g, '').substring(0, 150) + (entry.content.length > 150 ? '...' : '') : 'No content preview available';
          const entryDate = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date';

          return (
            <div key={entry.id} className="bg-white p-5 rounded-lg shadow border border-gray-200 flex flex-col justify-between transition-shadow hover:shadow-md">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 break-words">{entry.title || "Untitled"}</h3>
                  <div className="flex space-x-2 text-gray-400 flex-shrink-0 ml-2">
                    <button onClick={() => handleEditEntry(entry.id)} className="hover:text-blue-600 transition-colors duration-150 ease-in-out" title="Edit Entry">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteEntry(entry.id)} className="hover:text-red-600 transition-colors duration-150 ease-in-out" title="Delete Entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 break-words overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {previewText}
                </p>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                <span>{entryDate}</span>
                <span className="ml-auto text-xs text-gray-400">{getTimeAgo(entry.lastSavedAt)}</span>
              </div>
            </div>
          );
        })}

        {selectedCollectionId && displayedEntries.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow border border-gray-200">
            <p className="text-lg mb-2">This collection is empty{searchQuery ? ' for your current search' : ''}.</p>
            <p>Click "New Entry" to add your first note!</p>
          </div>
        )}
        {!selectedCollectionId && collections.length > 0 && (
           <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-lg">Select a collection from the tabs above to view entries.</p>
           </div>
        )}
        {collections.length === 0 && (
           <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-lg mb-2">You don't have any collections yet.</p>
              <p>Click "Add a Collection" to get started!</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
