"use client";

// Note: This component currently uses static data.
// You might need to pass props later for dynamic values.
// We also need a circular progress component here (different style)
// Reusing the existing one might require prop changes or a new component.

// Placeholder for the specific circular progress used here.
// Assuming a similar API to the previously extracted CircularProgress
const ScoreCircularProgress = ({ value }: { value: number }) => (
  <div className="relative w-24 h-24 mb-2">
    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
      <circle
        className="text-gray-600"
        strokeWidth="8"
        stroke="currentColor"
        fill="transparent"
        r="44"
        cx="50"
        cy="50"
      />
      <circle
        className="text-blue-400"
        strokeWidth="8"
        strokeDasharray={`${value * 2.76} 276`} // 2 * PI * 44 approx 276
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r="44"
        cx="50"
        cy="50"
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white">
      {value}
    </div>
  </div>
);

const ProductivityScore = () => {
  const productivityValue = 85; // Example static value

  return (
    <div className="lg:col-span-3">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl font-semibold text-white">📊 App Streak</span>
        </div>
        
        <div className="flex flex-col items-center">
          <ScoreCircularProgress value={productivityValue} />
          <span className="text-gray-300 text-sm mb-2">Productivity Score</span>
        </div>
      </div>
    </div>
  );
};

export default ProductivityScore; 