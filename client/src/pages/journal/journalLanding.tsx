// LandingPage.tsx
import React, { useState } from 'react';

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

const mockCollections: Collection[] = [
  {
    id: 'journal',
    name: 'Journal',
    entries: [
      { id: '1', title: 'April 1 WEEK EIGHT', content: 'Entry for April 1...' },
      { id: '2', title: 'March 25 WEEK SEVEN', content: 'Entry for March 25...' },
      { id: '3', title: 'March 18 WEEK SIX', content: 'Entry for March 18...' },
    ],
  },
  {
    id: 'dreams',
    name: 'Dream Logs',
    entries: [
      { id: '4', title: 'Weird dream 1', content: 'Aliens, pizza, whatever...' },
      { id: '5', title: 'Flying again', content: 'Soaring over mountains...' },
    ],
  },
];

const LandingPage: React.FC = () => {
  const [collections] = useState<Collection[]>(mockCollections);
  const [selectedCollection, setSelectedCollection] = useState<Collection>(collections[0]);
  const [selectedEntry, setSelectedEntry] = useState<Entry>(collections[0].entries[0]);

  return (
    <div className="flex min-h-screen bg-[#ECEFF1] font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-[#1976D2] mb-4">Jurnol</h2>

        {collections.map((col) => (
          <div key={col.id} className="mb-6">
            <h3 className="text-sm font-semibold text-[#009688] mb-2">{col.name}</h3>
            <ul className="space-y-1 text-sm">
              {col.entries.map((entry) => (
                <li
                  key={entry.id}
                  onClick={() => {
                    setSelectedCollection(col);
                    setSelectedEntry(entry);
                  }}
                  className={`cursor-pointer px-2 py-1 rounded hover:bg-[#1976D2]/10 ${
                    selectedEntry.id === entry.id ? 'bg-[#1976D2]/20 font-semibold' : ''
                  }`}
                >
                  {entry.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1976D2] mb-4">
            {selectedEntry?.title || 'Untitled'}
          </h1>
          <textarea
            className="w-full h-[75vh] bg-white shadow-lg rounded-lg p-6 text-base leading-relaxed text-gray-900 placeholder-gray-500 outline-none resize-none focus:ring-2 focus:ring-[#1976D2]"
            value={selectedEntry?.content || ''}
            onChange={(e) =>
              setSelectedEntry({ ...selectedEntry, content: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
