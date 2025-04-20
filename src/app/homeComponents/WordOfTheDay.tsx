"use client";

const WordOfTheDay = () => (
  <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg font-semibold">📚 Word of the Day</span>
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-purple-900">Ephemeral</h3>
      <p className="text-sm text-gray-600 italic">/əˈfem(ə)rəl/</p>
      <p className="text-sm text-gray-700">Lasting for a very short time; transitory; temporary.</p>
      <p className="text-sm text-gray-600 mt-2">"The ephemeral nature of social media trends."</p>
    </div>
  </div>
);

export default WordOfTheDay; 