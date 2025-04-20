"use client";

import { useState } from 'react';

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

type GoalView = 'daily' | 'sprint' | 'vision';

const Home = () => {
  const [activeGoalView, setActiveGoalView] = useState<GoalView>('daily');
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review project documentation', completed: false },
    { id: 2, text: 'Team sync meeting at 2 PM', completed: true },
    { id: 3, text: 'Update sprint board', completed: false },
  ]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Momentum - 1 column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-semibold">🎯 Daily Momentum</span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Today's Focus Goal</span>
              </div>
              <input
                type="text"
                placeholder="Set your main goal for today..."
                className="w-full p-2 bg-white rounded-md border border-gray-200"
              />
            </div>

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

            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span>🧘</span>
                  <span>Meditation</span>
                </span>
                <span>3 days 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span>💪</span>
                  <span>Exercise</span>
                </span>
                <span>5 days 🔥</span>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-gray-700">✅ Today's Tasks</span>
              </div>
              <div className="bg-white rounded-lg p-4">
                <ul className="space-y-2">
                  {tasks.map(task => (
                    <li key={task.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          setTasks(tasks.map(t =>
                            t.id === task.id ? { ...t, completed: !t.completed } : t
                          ));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {task.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddTask} className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    className="flex-1 text-sm bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-300 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-gray-600"
                    disabled={!newTask.trim()}
                  >
                    <span className="text-lg">+</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Tracker - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-semibold">✅ Goal Tracker</span>
            </div>

            {/* Goal Type Selector */}
            <div className="flex space-x-2 mb-8">
              <button
                onClick={() => setActiveGoalView('daily')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeGoalView === 'daily'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Daily Goals
              </button>
              <button
                onClick={() => setActiveGoalView('sprint')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeGoalView === 'sprint'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                2-Week Sprint
              </button>
              <button
                onClick={() => setActiveGoalView('vision')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeGoalView === 'vision'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Long-term Vision
              </button>
            </div>

            {/* Daily Goals View */}
            {activeGoalView === 'daily' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Complete project meeting</span>
                    <span>100%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Write documentation</span>
                    <span>60%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Review pull requests</span>
                    <span>30%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <button className="w-full mt-8 py-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100">
                  Add Goal
                </button>
              </div>
            )}

            {/* Sprint View */}
            {activeGoalView === 'sprint' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Implement new features</span>
                    <span>45%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Code refactoring</span>
                    <span>80%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <button className="w-full mt-8 py-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100">
                  Add Sprint Goal
                </button>
              </div>
            )}

            {/* Vision View */}
            {activeGoalView === 'vision' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Launch MVP</span>
                    <span>25%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Grow user base</span>
                    <span>15%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <button className="w-full mt-8 py-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100">
                  Add Vision Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access - 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-semibold">⭕ Quick Access</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <span className="text-2xl mb-2">📱</span>
                <span className="text-sm font-medium text-gray-700">
                  <span className="text-blue-500">|</span> Notes
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span className="text-2xl mb-2">📚</span>
                <span className="text-sm font-medium text-gray-700">Study Sets</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <span className="text-2xl mb-2">❤️</span>
                <span className="text-sm font-medium text-gray-700">Affirmations</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <span className="text-2xl mb-2">⏱️</span>
                <span className="text-sm font-medium text-gray-700">Breathing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Today's Progress - 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-semibold">📊 Today's Progress</span>
            </div>
            
            <div className="flex flex-col items-center">
              {/* Circular Progress */}
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
                    strokeDasharray={`${85 * 2.76} 276`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="44"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
                  85
                </div>
              </div>
              <span className="text-gray-600 text-sm">Productivity Score</span>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-8 mt-6 bg-gray-50 p-4 rounded-lg">
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
              <div className="w-full mt-4 space-y-2">
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
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-medium">Total today</span>
                  <span className="font-medium">7 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mind Fuel - more compact, 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-yellow-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-semibold">💡 Mind Fuel</span>
            </div>

            <div className="space-y-4">
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
