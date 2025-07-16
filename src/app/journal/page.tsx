"use client";

import React, { useEffect } from "react";
import PageTransition from '@/components/PageTransition';
import ConfirmationDialog from "@/components/ConfirmationDialog";
import DropdownMenu from "@/components/DropdownMenu";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { JournalPageSkeleton, SkeletonDemo } from '@/components/skeletons';
import { initializeAuth } from '@/api/client';
import { timeService } from '@/services/timeService';

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
import { useConsistentDate } from "@/hooks/useConsistentDate";

/**
 * Main Journal page component
 * Provides a complete journaling experience with collections, entries, and backend integration
 */
const Journal: React.FC = () => {
  // Authentication check and initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      
      if (!token || token === 'dummy-auth-token') {
        window.location.href = '/';
        return;
      }
      
      // Initialize authentication in axios client
      initializeAuth();
    }
  }, []);

  const journalState = useJournalState();
  const gratitudeHook = useGratitude();
  const { isReady: dateReady } = useConsistentDate();
  

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
  } = journalState;

  const {
    gratitudes,
    isLoading: gratitudesLoading,
    error: gratitudesError,
    addGratitude,
    updateGratitude,
    clearError: clearGratitudeError,
    totalGratitudes,
  } = gratitudeHook;

  // Show loading state while initial data loads or time service is not ready
  if ((collectionsLoading && collections.length === 0) || !dateReady) {
    return (
      <PageTransition>
        <JournalPageSkeleton />
      </PageTransition>
    );
  }

  // Show error state if collections failed to load and no cached data
  if (collectionsError && collections.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1A2537" }}>
          <div className="text-center max-w-md mx-auto px-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Journal</h2>
            <p className="text-gray-300 mb-6 leading-relaxed break-words overflow-hidden">{collectionsError}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Loading
              </button>
              <button
                onClick={handleClearError}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Continue Offline
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SkeletonDemo
        skeleton={<JournalPageSkeleton />}
        delay={100} // Minimal delay for smooth transition
        enabled={false} // Disable forced demo mode
      >
        <div 
          className="min-h-screen py-8"
          style={{ backgroundColor: "#1A2537" }}
        >
          <div className="max-w-full mx-auto px-6">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-3">Journal</h1>
              <p className="text-lg text-gray-300">Record your thoughts, experiences, and insights</p>
              
              {/* Error Banner */}
              {(collectionsError || gratitudesError) && (
                <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg max-w-2xl mx-auto">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-200">
                      Some features may be limited due to connection issues
                    </span>
                    <button
                      onClick={() => {
                        handleClearError();
                        clearGratitudeError();
                      }}
                      className="ml-3 text-yellow-400 hover:text-yellow-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
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
                  isLoading={collectionsLoading}
                />

                {/* Search and Actions */}
                <SearchAndActions
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCollection={selectedCollection}
                  onAddNewEntry={handleAddNewEntry}
                  selectedCollectionId={selectedCollectionId}
                  isLoading={operationLoading}
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
                    isLoading={collectionsLoading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <Sidebar
              gratitudes={gratitudes}
              onAddGratitude={addGratitude}
              onEditGratitude={updateGratitude}
              totalEntries={totalEntries}
              totalGratitudes={totalGratitudes}
              isLoadingGratitudes={gratitudesLoading}
              gratitudeError={gratitudesError}
              onClearGratitudeError={clearGratitudeError}
            />
          </div>

          {/* Modals */}
          <CollectionModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleCreateCollection}
            title={editingCollection ? "Edit Collection" : "Create New Collection"}
            formData={formData}
            onFormChange={updateFormData}
            editingCollection={editingCollection}
            passwordError={passwordError}
            nameExists={nameExists}
            isLoading={operationLoading}
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
            isLoading={operationLoading}
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
                    handleEditEntry(openDropdown.entry.id);
                  }
                  setOpenDropdown(null);
                }}
                onDelete={(e) => {
                  e?.stopPropagation();
                  if (openDropdown.type === 'collection' && openDropdown.collection) {
                    handleDeleteCollection(openDropdown.collection.id.toString());
                  } else if (openDropdown.type === 'entry' && openDropdown.entry) {
                    handleDeleteEntry(openDropdown.entry.id);
                  }
                  setOpenDropdown(null);
                }}
                onClose={() => setOpenDropdown(null)}
                showDelete={
                  openDropdown.type === 'entry' || 
                  (openDropdown.type === 'collection' && openDropdown.collection?.name !== "My Notes")
                }
              />
            </div>
          )}
        </div>
      </div>
      </SkeletonDemo>
    </PageTransition>
  );
};

export default Journal;
