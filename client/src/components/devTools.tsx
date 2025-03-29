import React, { useState } from 'react';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);

  const clearLocalStorage = () => {
    localStorage.clear();
    alert('Local storage cleared');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-[var(--color-primary1)] font-semibold"
      >
        Dev Tools
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 bg-white border rounded shadow-md p-4 space-y-2 min-w-[150px] z-20">
          <button
            onClick={clearLocalStorage}
            className="block text-[var(--color-primary1)]"
          >
            Clear Local Storage
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="block text-[var(--color-primary1)]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default DevTools;