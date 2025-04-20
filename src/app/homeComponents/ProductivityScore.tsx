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
        className="text-gray-100"
        strokeWidth="8"
        stroke="currentColor"
        fill="transparent"
        r="44"
        cx="50"
        cy="50"
      />
      <circle
        className="text-gray-900"
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
    <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
      {value}
    </div>
  </div>
);

const ProductivityScore = () => {
  const productivityValue = 85; // Example static value

  return (
    <div className="lg:col-span-3">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl font-semibold">📊 Today's Progress</span>
        </div>
        
        <div className="flex flex-col items-center">
          <ScoreCircularProgress value={productivityValue} />
          <span className="text-gray-600 text-sm mb-2">Productivity Score</span>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-3 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-semibold">4</div>
              <div className="text-sm text-gray-600">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">2</div>
              <div className="text-sm text-gray-600">Pomodoros</div>
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="w-full mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">+1 point per task</span>
              <span className="font-medium">+4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">+2 points per pomodoro</span>
              <span className="font-medium">+4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">-1 skipped habit</span>
              <span className="font-medium text-red-500">-1</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
              <span className="font-medium">Total today</span>
              <span className="font-medium">7 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityScore; 