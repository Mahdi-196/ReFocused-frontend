"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCollections, Entry } from "../collection";
import { ChevronLeft } from "lucide-react";

const TextEditor = dynamic(() => import("@/components/TextEditor"), {
  ssr: false,
});

export default function NewEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collections, saveEntry } = useCollections();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Set collection ID from URL or default
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    if (collectionId && collections.some(c => c.id === collectionId)) {
      setSelectedCollectionId(collectionId);
    } else if (collections.length > 0) {
      const defaultCol = collections.find((c) => c.name === "My Notes") || collections[0];
      if (defaultCol) {
        setSelectedCollectionId(defaultCol.id);
      }
    }
  }, [collections, searchParams]);

  // Format the date as shown in the image
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleSave = async () => {
    if (!selectedCollectionId) {
      alert("Please select a collection first");
      return;
    }

    try {
      setIsSaving(true);
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled Entry",
        content,
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
      };

      saveEntry(selectedCollectionId, newEntry);
      router.push("/journal");
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back button and collection selector */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/journal")}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Journal
          </button>
          <select
            value={selectedCollectionId || ""}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>Select Collection</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name} {col.isPrivate ? "(Private)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header with date */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-600 text-sm">
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title"
            className="w-full text-3xl font-bold mb-8 border-none focus:outline-none focus:ring-0 placeholder-gray-300"
            autoFocus
          />

          {/* Text Editor */}
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 