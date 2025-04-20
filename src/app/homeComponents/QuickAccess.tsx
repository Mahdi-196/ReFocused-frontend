"use client";

const QuickAccess = () => (
  <div className="lg:col-span-1">
    <div className="bg-white rounded-xl p-6 shadow-sm aspect-square">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl font-semibold">⭕ Quick Access</span>
      </div>
      <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
        <button className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
          <span className="text-3xl mb-3">📱</span>
          <span className="text-sm font-medium text-gray-700">
            <span className="text-blue-500">|</span> Notes
          </span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <span className="text-3xl mb-3">📚</span>
          <span className="text-sm font-medium text-gray-700">Study Sets</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
          <span className="text-3xl mb-3">❤️</span>
          <span className="text-sm font-medium text-gray-700">Affirmations</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
          <span className="text-3xl mb-3">⏱️</span>
          <span className="text-sm font-medium text-gray-700">Breathing</span>
        </button>
      </div>
    </div>
  </div>
);

export default QuickAccess; 