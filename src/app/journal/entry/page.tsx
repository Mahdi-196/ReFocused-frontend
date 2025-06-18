"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Import types and hooks
import type { Entry } from "../types";
import { useCollections } from "../hooks/useCollections";
import { formatCurrentDate } from "../utils";

const TextEditor = dynamic(() => import("@/components/textEditor"), {
  ssr: false,
});

/**
 * Entry editor component for creating and editing journal entries
 * Provides rich text editing with autosave and collection management
 */
function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collections, saveEntry } = useCollections();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);

  // Set collection ID and load entry data from URL
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    const entryIdParam = searchParams.get('id');

    if (collectionId && collections.some(c => c.id === collectionId)) {
      setSelectedCollectionId(collectionId);
      
      // If editing an existing entry, load its data
      if (entryIdParam) {
        setEntryId(entryIdParam);
        const collection = collections.find(c => c.id === collectionId);
        const entry = collection?.entries.find(e => e.id === entryIdParam);
        if (entry) {
          setTitle(entry.title || "");
          setContent(entry.content || "");
        }
      }
    } else if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, searchParams]);

  const formattedDate = formatCurrentDate();

  const handleSave = async () => {
    if (!selectedCollectionId) {
      alert("Please select a collection first");
      return;
    }

    try {
      setIsSaving(true);
      const entry: Entry = {
        id: entryId || crypto.randomUUID(),
        title: title.trim() || "Untitled Entry",
        content,
        createdAt: entryId ? undefined : new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
      };

      saveEntry(selectedCollectionId, entry);
      router.push("/journal");
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
            onClick={() => router.push("/journal")}
            className="inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-105"
            aria-label="Return to journal"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Journal
          </button>
          <select
            value={selectedCollectionId || ""}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="px-3 py-1.5 border border-gray-600 bg-gray-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            aria-label="Select collection for this entry"
          >
            <option value="" disabled>Select Collection</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name} {col.isPrivate ? "(Private)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Entry Editor */}
        <div 
          className="rounded-lg shadow-md border border-gray-600 p-8 transition-all duration-300 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          {/* Date Header */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-700/50 text-gray-300 text-sm">
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title"
            className="w-full text-3xl font-bold mb-8 border-none bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200"
            autoFocus
            aria-label="Entry title"
          />

          {/* Content Editor */}
          <div className="mb-8">
            <TextEditor
              value={content}
              onChange={setContent}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!selectedCollectionId || isSaving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              aria-label={isSaving ? "Saving entry..." : "Save entry"}
            >
              {isSaving ? "Saving..." : "Save Entry"}
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
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <EntryContent />
    </Suspense>
  );
} 