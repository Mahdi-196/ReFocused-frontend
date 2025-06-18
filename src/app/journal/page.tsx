"use client";

import React from "react";
import PageTransition from '@/components/PageTransition';
import ConfirmationDialog from "@/components/ConfirmationDialog";
import DropdownMenu from "@/components/DropdownMenu";

// Import new components
import { CollectionModal } from "./components/CollectionModal";
import { PasswordPromptModal } from "./components/PasswordPromptModal";
import { CollectionTabs } from "./components/CollectionTabs";
import { SearchAndActions } from "./components/SearchAndActions";
import { EntryGrid } from "./components/EntryGrid";
import { Sidebar } from "./components/Sidebar";

// Import hooks
import { useJournalState } from "./hooks/useJournalState";
import { useGratitude } from "./hooks/useGratitude";

/**
 * Main Journal page component
 * Provides a complete journaling experience with collections, entries, and additional features
 */
const Journal: React.FC = () => {
  const journalState = useJournalState();
  const { gratitudes, addGratitude, totalGratitudes } = useGratitude();

  const {
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
    setFormData,
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
  } = journalState;

  return (
    <PageTransition>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="max-w-full mx-auto px-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-3">Journal</h1>
            <p className="text-lg text-gray-300">Record your thoughts, experiences, and insights</p>
          </div>
          
          {/* Main Layout - Three Columns */}
          <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
            
            {/* Left Column - Main Journal Content */}
            <div className="flex-1 xl:flex-[2] max-w-none">
              <div className="mb-8">
                {/* Collection Navigation */}
                <CollectionTabs
                  collections={collections}
                  selectedCollectionId={selectedCollectionId}
                  onCollectionSelect={handleCollectionSelect}
                  onAddCollection={handleAddNewCollection}
                  onOpenDropdown={setOpenDropdown}
                  openDropdown={openDropdown}
                />

                {/* Search and Actions */}
                <SearchAndActions
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCollection={selectedCollection}
                  onAddNewEntry={handleAddNewEntry}
                  selectedCollectionId={selectedCollectionId}
                />
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
                  <EntryGrid
                    entries={displayedEntries}
                    selectedCollection={selectedCollection}
                    searchQuery={searchQuery}
                    selectedCollectionId={selectedCollectionId}
                    onEditEntry={handleEditEntry}
                    onOpenDropdown={setOpenDropdown}
                    openDropdown={openDropdown}
                    collections={collections}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <Sidebar
              gratitudes={gratitudes}
              onAddGratitude={addGratitude}
              totalEntries={totalEntries}
              totalGratitudes={totalGratitudes}
            />
          </div>

          {/* Modals */}
          <CollectionModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleCreateCollection}
            title={editingCollection ? "Edit Collection" : "Create New Collection"}
            formData={formData}
            onFormChange={setFormData}
            editingCollection={editingCollection}
            passwordError={passwordError}
            nameExists={nameExists}
          />

          <PasswordPromptModal
            passwordPrompt={passwordPrompt}
            enteredPassword={enteredPassword}
            onPasswordChange={setEnteredPassword}
            onSubmit={handlePasswordSubmit}
            onClose={handleClosePasswordPrompt}
          />

          <ConfirmationDialog
            isOpen={!!deleteConfirmation}
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={confirmDelete}
            title={`Delete ${deleteConfirmation?.type === 'entry' ? 'Note' : 'Collection'}`}
            message={`Are you sure you want to delete "${deleteConfirmation?.name}"? This action cannot be undone.`}
          />

          {/* Dropdown Menu */}
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
