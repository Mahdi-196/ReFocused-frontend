'use client';

interface MantraInputProps {
  mantra: string;
  onChange: (text: string) => void;
  onSave: () => void;
}

export default function MantraInput({ mantra, onChange, onSave }: MantraInputProps) {
  const MAX_LENGTH = 100;
  const remainingChars = MAX_LENGTH - mantra.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={mantra}
            onChange={(e) => onChange(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Enter your daily mantra..."
            className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
            aria-label="Daily mantra input"
          />
          <span className="absolute right-0 top-0 text-sm text-gray-500">
            {remainingChars}
          </span>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          aria-label="Save and pin mantra"
        >
          Save & Pin
        </button>
      </div>
    </div>
  );
} 