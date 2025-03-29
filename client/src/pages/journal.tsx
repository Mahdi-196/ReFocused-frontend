import React, { useState, useEffect } from "react";

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  date: string;
}

const LOCAL_STORAGE_KEY = "journalEntries";

// Main Journal Component
const Journal = () => {
  // Load entries from localStorage immediately on first render
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // States for form and search
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter entries based on search input by letter
  const filteredEntries = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Save updated entries to localStorage every time entries change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Update title/content for new or editing entry
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editingEntry) {
      setEditingEntry({ ...editingEntry, [name]: value });
    } else {
      setNewEntry({ ...newEntry, [name]: value });
    }
  };

  // Save new entry or update existing one
  const handleSaveEntry = () => {
    if (editingEntry) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntry.id ? editingEntry : entry
        )
      );
      setEditingEntry(null);
    } else {
      const newId = Date.now();
      const newItem: JournalEntry = {
        id: newId,
        title: newEntry.title,
        content: newEntry.content,
        date: new Date().toLocaleDateString(),
      };
      setEntries((prev) => [newItem, ...prev]);
      setNewEntry({ title: "", content: "" });
    }
  };

  // Set selected entry for editing
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
  };

  // Remove entry by ID
  const handleDeleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // Cancel editing mode
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  // Render journal UI
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-4">
          <h1 className="text-white text-3xl font-bold">My Journal</h1>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Search bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search journal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Entry form */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {editingEntry ? "Edit Entry" : "New Entry"}
            </h2>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={editingEntry ? editingEntry.title : newEntry.title}
              onChange={handleInputChange}
              className="w-full p-2 mb-2 border border-gray-300 rounded"
            />
            <textarea
              name="content"
              placeholder="Write your thoughts here..."
              value={editingEntry ? editingEntry.content : newEntry.content}
              onChange={handleInputChange}
              className="w-full p-2 mb-2 border border-gray-300 rounded h-32"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEntry}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                {editingEntry ? "Update Entry" : "Add Entry"}
              </button>
              {editingEntry && (
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* List of entries */}
          <div className="border-t pt-4">
            <h2 className="text-2xl font-semibold mb-4">Entries</h2>
            {filteredEntries.length === 0 ? (
              <p className="text-gray-500">No entries found.</p>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="mb-4 p-4 border border-gray-200 rounded shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">{entry.title}</h3>
                    <span className="text-sm text-gray-500">{entry.date}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal