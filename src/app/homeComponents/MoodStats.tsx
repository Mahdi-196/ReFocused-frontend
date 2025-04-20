"use client";

const MoodStats = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-gray-600">Mood</span>
      <div className="flex items-center gap-2">
        <span>8/10</span>
        <span>😊</span>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-gray-600">Stress</span>
      <div className="flex items-center gap-2">
        <span>3/10</span>
        <span>😌</span>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-gray-600">Focus</span>
      <div className="flex items-center gap-2">
        <span>7/10</span>
        <span>💫</span>
      </div>
    </div>
  </div>
);

export default MoodStats; 