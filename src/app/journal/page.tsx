"use client";

import React, { useState, useEffect } from "react";
import TextEditor from "@/components/TextEditor";
import { Plus } from "lucide-react";

type Entry = {
  id: string;
  title: string;
  content: string;
};

type Collection = {
  id: string;
  name: string;
  entries: Entry[];
};

const LOCAL_STORAGE_KEY = "jurnol_collections";

const Journal: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed)
        ? parsed
        : [
            {
              id: "journal",
              name: "Journal",
              entries: [
                {
                  id: "1",
                  title: "April 1 WEEK EIGHT",
                  content: "Entry for April 1...",
                },
                {
                  id: "2",
                  title: "March 25 WEEK SEVEN",
                  content: "Entry for March 25...",
                },
              ],
            },
          ];
    } catch (err) {
      console.warn("Invalid localStorage data. Resetting.");
      return [];
    }
  });

  const firstCollection = collections[0] || null;
  const firstEntry = firstCollection?.entries?.[0] || null;

  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(firstCollection);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(firstEntry);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const updateEntryContent = (html: string) => {
    if (selectedEntry) {
      setSelectedEntry({ ...selectedEntry, content: html });
    }
  };

  const handleSave = () => {
    if (!selectedCollection || !selectedEntry) return;

    const updatedCollections = collections.map((col) => {
      if (col.id !== selectedCollection.id) return col;
      return {
        ...col,
        entries: col.entries.map((entry) =>
          entry.id === selectedEntry.id ? selectedEntry : entry
        ),
      };
    });

    setCollections(updatedCollections);
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="flex h-screen font-sans text-gray-800 bg-[#ECEFF1]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-[#1976D2] mb-4">Jurnol</h2>

        {/* Collection dropdown mock */}
        <div className="flex items-center gap-2 mb-6">
          <select className="flex-1 border rounded px-2 py-1 text-sm">
            {collections.map((col) => (
              <option key={col.id}>{col.name}</option>
            ))}
          </select>
          <button className="text-[#1976D2] hover:text-[#0f4faa]">
            <Plus size={18} />
          </button>
        </div>

        {collections.map((col) => (
          <div key={col.id} className="mb-6">
            <ul className="space-y-1 text-sm">
              {col.entries.map((entry) => (
                <li
                  key={entry.id}
                  onClick={() => {
                    setSelectedCollection(col);
                    setSelectedEntry(entry);
                  }}
                  className={`cursor-pointer px-2 py-1 rounded hover:bg-[#1976D2]/10 ${
                    selectedEntry?.id === entry.id
                      ? "bg-[#1976D2]/20 font-semibold"
                      : ""
                  }`}
                >
                  {entry.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Editor Panel */}
      <div className="flex flex-col flex-1 p-6 overflow-hidden">
        {selectedEntry ? (
          <>
            {/* Title row */}
            <div className="flex justify-between items-center mb-4 w-full">
              <div>
                <p className="text-sm text-[#009688] font-semibold">
                  {selectedCollection?.name || ""}
                </p>
                <h1 className="text-2xl font-bold text-[#1976D2]">
                  {selectedEntry.title || "Untitled"}
                </h1>
              </div>
              <p className="text-sm text-gray-600">{today}</p>
            </div>

            {/* Editor + Sticky Save */}
            <div className="flex-1 bg-white rounded shadow p-0 flex flex-col overflow-hidden">
              {/* Scrollable Editor */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
                <TextEditor
                  value={selectedEntry?.content || ""}
                  onChange={updateEntryContent}
                />
              </div>

              {/* Sticky Save button */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-[#009688] text-white px-4 py-2 rounded shadow hover:bg-[#00796B]"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic mt-10">No entry selected.</div>
        )}
      </div>
    </div>
  );
};

export default Journal;
