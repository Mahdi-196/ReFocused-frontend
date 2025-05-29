"use client";

const MindFuel = () => (
  <section 
    className="lg:col-span-1" 
    aria-labelledby="mind-fuel"
  >
    <div className="bg-yellow-50 rounded-xl p-6 shadow-sm h-full">
      <h2 id="mind-fuel" className="flex items-center gap-2 mb-4 text-xl font-semibold text-gray-800">
        💡 Mind Fuel
      </h2>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Daily Quote</span>
          </div>
          <blockquote className="text-sm italic text-gray-600 border-l-4 border-yellow-200 pl-3">
            "The only way to do great work is to love what you do."
            <footer className="text-xs text-gray-500 mt-1">— Steve Jobs</footer>
          </blockquote>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Tip of the Day</span>
          </div>
          <p className="text-sm text-gray-600">
            Break large tasks into smaller, manageable chunks to maintain momentum.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Brain Boost</span>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Serendipity</h4>
            <p className="text-xs text-gray-600">
              The occurrence of events by chance in a happy or beneficial way.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Weekly Focus</span>
          </div>
          <p className="text-sm text-gray-600">
            "Embrace challenges as opportunities for growth and learning."
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Mindfulness Moment</span>
          </div>
          <p className="text-sm text-gray-600">
            Take 3 deep breaths and focus on the present moment.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">Productivity Hack</span>
          </div>
          <p className="text-sm text-gray-600">
            Use the 2-minute rule: If a task takes less than 2 minutes, do it now.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default MindFuel; 