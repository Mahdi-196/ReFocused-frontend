"use client";

import React, { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Optionally log to monitoring here
    // console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl text-white">
        <h2 className="text-lg font-semibold mb-2">This page failed to load</h2>
        <p className="text-gray-300 mb-6">Please try again or return to the home page.</p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Retry
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}


