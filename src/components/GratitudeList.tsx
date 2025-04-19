'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface GratitudeListProps {
  entries: string[];
  onChange: (index: number, text: string) => void;
  onSave: () => void;
}

export default function GratitudeList({ entries, onChange, onSave }: GratitudeListProps) {
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    onSave();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {index + 1}. I am grateful for...
            </label>
            <input
              type="text"
              value={entry}
              onChange={(e) => onChange(index, e.target.value)}
              className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
              placeholder="Type your gratitude here..."
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Gratitudes
        </button>
      </div>

      {/* Save Toast */}
      {showSavedToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-5 h-5" />
          <span>Saved!</span>
        </div>
      )}
    </div>
  );
} 