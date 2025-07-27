import React from "react";

interface Gratitude {
  id: number;
  text: string;
  date: string;
  createdAt?: Date;
}

interface GratitudesDisplayProps {
  gratitudes: Gratitude[];
}

export default function GratitudesDisplay({ gratitudes }: GratitudesDisplayProps) {
  // Limit to max 3 gratitudes and filter out empty ones
  const filteredGratitudes = gratitudes
    .filter(g => g.text && g.text.trim().length > 0)
    .slice(0, 3);

  if (filteredGratitudes.length === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="font-medium text-white mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          Gratitudes
        </div>
        <div className="text-center text-gray-400 py-6">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-sm">No gratitudes recorded on this date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="font-medium text-white mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        Gratitudes
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {filteredGratitudes.map((gratitude, index) => (
          <div
            key={gratitude.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-pink-500/20 bg-pink-500/10 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm leading-relaxed">
                {gratitude.text.slice(0, 125)}
                {gratitude.text.length > 125 && (
                  <span className="text-gray-400">...</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}