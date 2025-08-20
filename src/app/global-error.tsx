"use client";

import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-[#1A2537] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-gray-300 mb-6">An unexpected error occurred. Please try again.</p>
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Go home
            </a>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-sm text-gray-400">
              <summary>Details (dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">{error?.message}</pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}


