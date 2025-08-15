"use client";

import { useState } from 'react';
import { TestTube } from 'lucide-react';
// Testing modal removed

export default function DevTestingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        title="Open API Testing Suite (Dev Only)"
      >
        <TestTube className="w-5 h-5" />
      </button>
      
      {/* Testing modal removed */}
    </>
  );
}