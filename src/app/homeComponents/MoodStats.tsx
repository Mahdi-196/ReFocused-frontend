"use client";

const MoodStats = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-gray-300">Mood</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-200 font-medium">8/10</span>
        <span>😊</span>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-gray-300">Stress</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-200 font-medium">3/10</span>
        <span>😌</span>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-gray-300">Focus</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-200 font-medium">7/10</span>
        <span>💫</span>
      </div>
    </div>
  </div>
);

export default MoodStats; 