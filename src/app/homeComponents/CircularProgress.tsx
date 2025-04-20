"use client";

const CircularProgress = ({ value }: { value: number }) => (
  <div className="relative w-32 h-32">
    <svg className="w-full h-full" viewBox="0 0 100 100">
      <circle
        className="text-gray-200"
        strokeWidth="10"
        stroke="currentColor"
        fill="transparent"
        r="45"
        cx="50"
        cy="50"
      />
      <circle
        className="text-blue-600"
        strokeWidth="10"
        strokeDasharray={`${value * 2.83} 283`}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r="45"
        cx="50"
        cy="50"
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-2xl font-semibold">{value}%</span>
    </div>
  </div>
);

export default CircularProgress; 