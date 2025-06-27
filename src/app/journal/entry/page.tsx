"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, AlertCircle, Loader2 } from "lucide-react";
import { useTime } from '@/contexts/TimeContext';
import PageTransition from '@/components/PageTransition';

// Import types and hooks
import type { Entry } from "../types";
import { useCollections } from "../hooks/useCollections";
import { formatCurrentDate } from "../utils";

const TextEditor = dynamic(() => import("@/components/textEditor"), {
  ssr: false,
});

/**
 * Entry editor component for creating and editing journal entries
 * Provides rich text editing with backend integration and autosave
 */
function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collections, saveEntry, getEntry, isLoading: collectionsLoading, error: collectionsError } = useCollections();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { getCurrentDateTime } = useTime();

  // Authentication check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      if (!token || token === 'dummy-auth-token') {
        console.log('🔐 No valid authentication token found, redirecting to landing page');
        window.location.href = '/';
        return;
      }
    }
  }, []);

  // Track changes for unsaved indicator
  useEffect(() => {
    setHasUnsavedChanges(title.trim() !== "" || content.trim() !== "");
  }, [title, content]);

  // Set collection ID and load entry data from URL
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    const entryIdParam = searchParams.get('id');

    if (collectionsLoading) return; // Wait for collections to load

    if (collectionId && collections.some(c => c.id === collectionId)) {
      setSelectedCollectionId(collectionId);
      
      // If editing an existing entry, load its data
      if (entryIdParam) {
        loadEntry(entryIdParam);
      }
    } else if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, searchParams, collectionsLoading]);

  const loadEntry = async (id: string) => {
    setIsLoadingEntry(true);
    try {
      setEntryId(id);
      const entry = await getEntry(id);
      if (entry) {
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setHasUnsavedChanges(false);
      } else {
        // Entry not found, try to find it in collections
        const collection = collections.find(c => c.id === selectedCollectionId);
        const localEntry = collection?.entries.find(e => e.id === id);
        if (localEntry) {
          setTitle(localEntry.title || "");
          setContent(localEntry.content || "");
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error("Failed to load entry:", error);
      setSaveError("Failed to load entry. You can still edit and save.");
    } finally {
      setIsLoadingEntry(false);
    }
  };

  const formattedDate = formatCurrentDate();

  const handleSave = async () => {
    if (!selectedCollectionId) {
      setSaveError("Please select a collection first");
      return;
    }

    if (!title.trim() && !content.trim()) {
      setSaveError("Entry cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      
      const entry: Entry = {
        id: entryId || crypto.randomUUID(),
        title: title.trim() || "Untitled Entry",
        content,
        createdAt: entryId ? undefined : getCurrentDateTime(),
        lastSavedAt: getCurrentDateTime(),
      };

      const success = await saveEntry(selectedCollectionId, entry);
      
      if (success) {
        setHasUnsavedChanges(false);
        router.push("/journal");
      } else {
        setSaveError("Failed to save entry. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
      setSaveError("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    router.push("/journal");
  };

  // Show loading state while collections are loading
  if (collectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1A2537" }}>
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading collections...</span>
        </div>
      </div>
    );
  }

  // Show error if collections failed to load
  if (collectionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1A2537" }}>
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Collections</h2>
          <p className="text-gray-300 mb-4">{collectionsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-8 font-sans"
      style={{ backgroundColor: "#1A2537" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navigation and Collection Selector */}
        <div 
          className="flex items-center justify-between mb-6 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-105"
            aria-label="Return to journal"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Journal
            {hasUnsavedChanges && <span className="ml-2 text-yellow-400 text-sm">• Unsaved changes</span>}
          </button>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedCollectionId || ""}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="px-3 py-1.5 border border-gray-600 bg-gray-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              aria-label="Select collection for this entry"
              disabled={isSaving || isLoadingEntry}
            >
              <option value="" disabled>Select Collection</option>
              {collections.map(col => (
                <option key={col.id} value={col.id}>
                  {col.name} {col.isPrivate ? "(Private)" : ""}
                </option>
              ))}
            </select>
            
            {/* Save Button in Header */}
            <button
              onClick={handleSave}
              disabled={!selectedCollectionId || isSaving || isLoadingEntry || (!title.trim() && !content.trim())}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              aria-label={isSaving ? "Saving entry..." : "Save entry"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-200">{saveError}</span>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Entry Editor */}
        <div 
          className="rounded-lg shadow-md border border-gray-600 p-8 transition-all duration-300 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          {/* Date Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-700/50 text-gray-300 text-sm">
              <span>{formattedDate}</span>
            </div>
            
            {isLoadingEntry && (
              <div className="flex items-center text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Loading entry...
              </div>
            )}
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title"
            className="w-full text-3xl font-bold mb-8 border-none bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200"
            autoFocus={!isLoadingEntry}
            disabled={isSaving || isLoadingEntry}
            aria-label="Entry title"
          />

          {/* Content Editor */}
          <div className="mb-8">
            <TextEditor
              value={content}
              onChange={setContent}
              disabled={isSaving || isLoadingEntry}
            />
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!selectedCollectionId || isSaving || isLoadingEntry || (!title.trim() && !content.trim())}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              aria-label={isSaving ? "Saving entry..." : "Save entry"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Entry...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Entry
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Entry page wrapper with Suspense boundary
 * Handles loading states for search params
 */
export default function Entry() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1A2537" }}>
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    }>
      <EntryContent />
    </Suspense>
  );
} 