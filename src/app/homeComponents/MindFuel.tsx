"use client";

const MindFuel = () => (
  <section 
    className="lg:col-span-1" 
    aria-labelledby="mind-fuel"
  >
    <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
      <h2 id="mind-fuel" className="flex items-center gap-2 mb-4 text-xl font-semibold text-white">
        💡 Mind Fuel
      </h2>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Daily Quote</span>
          </div>
          <blockquote className="text-sm italic text-gray-200 border-l-4 border-blue-400/50 pl-3">
            "The only way to do great work is to love what you do."
            <footer className="text-xs text-gray-400 mt-1">— Steve Jobs</footer>
          </blockquote>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Tip of the Day</span>
          </div>
          <p className="text-sm text-gray-200">
            Break large tasks into smaller, manageable chunks to maintain momentum.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Brain Boost</span>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1 text-white">Serendipity</h4>
            <p className="text-xs text-gray-200">
              The occurrence of events by chance in a happy or beneficial way.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Weekly Focus</span>
          </div>
          <p className="text-sm text-gray-200">
            "Embrace challenges as opportunities for growth and learning."
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Mindfulness Moment</span>
          </div>
          <p className="text-sm text-gray-200">
            Take 3 deep breaths and focus on the present moment.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-300">Productivity Hack</span>
          </div>
          <p className="text-sm text-gray-200">
            Use the 2-minute rule: If a task takes less than 2 minutes, do it now.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default MindFuel; 