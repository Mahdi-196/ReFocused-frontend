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

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

type Goal = {
  id: number;
  name: string;
  progress: number; // Percentage 0-100
};

type GoalView = 'sprint' | 'vision';

const Home = () => {
  const [activeGoalView, setActiveGoalView] = useState<GoalView>('sprint');
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Complete project meeting', completed: false },
    { id: 2, text: 'Write documentation', completed: false },
    { id: 3, text: 'Update sprint board', completed: false },
  ]);

  // Goal Tracker State
  const [sprintGoals, setSprintGoals] = useState<Goal[]>([
    { id: 201, name: 'Implement new features', progress: 45 },
    { id: 202, name: 'Code refactoring', progress: 80 },
  ]);
  const [visionGoals, setVisionGoals] = useState<Goal[]>([
    { id: 301, name: 'Launch MVP', progress: 25 },
    { id: 302, name: 'Grow user base', progress: 15 },
  ]);
  const [newGoalName, setNewGoalName] = useState('');

  // Edit Goal Modal State
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  // Store the goal being edited (including its type)
  const [editingGoal, setEditingGoal] = useState<Goal & { type: 'sprint' | 'vision' } | null>(null);
  const [editedGoalProgress, setEditedGoalProgress] = useState(0);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.length < 3 && newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const newGoal: Goal = {
      id: Date.now(),
      name: newGoalName.trim(),
      progress: 0, // Start progress at 0
    };

    if (activeGoalView === 'sprint') {
      setSprintGoals([...sprintGoals, newGoal]);
    } else if (activeGoalView === 'vision') {
      setVisionGoals([...visionGoals, newGoal]);
    }

    setNewGoalName(''); // Clear input after adding
  };

  const handleOpenEditGoalModal = (goal: Goal, type: 'sprint' | 'vision') => {
    setEditingGoal({ ...goal, type });
    setEditedGoalProgress(goal.progress);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal) return;

    const updatedGoal = { 
      ...editingGoal, 
      progress: editedGoalProgress 
    };

    if (editingGoal.type === 'sprint') {
      setSprintGoals(sprintGoals.map(g => g.id === editingGoal.id ? updatedGoal : g));
    } else if (editingGoal.type === 'vision') {
      setVisionGoals(visionGoals.map(g => g.id === editingGoal.id ? updatedGoal : g));
    }

    setIsEditGoalModalOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <main className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Momentum - 2 columns */}
        <div className="lg:col-span-2">
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
                className="w-full p-2 bg-transparent text-lg font-semibold text-gray-800 placeholder-gray-500 focus:outline-none focus:border-b-2 focus:border-blue-300"
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
                <ul className="space-y-2 mb-3">
                  {tasks.map(task => (
                    <li key={task.id} className="group relative flex items-center justify-between gap-2 pr-8">
                      <div className="flex items-center gap-2 flex-grow">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {
                            setTasks(tasks.map(t =>
                              t.id === task.id ? { ...t, completed: !t.completed } : t
                            ));
                          }}
                          className="flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                        aria-label="Delete task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddTask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={tasks.length >= 3 ? "Task limit reached" : "Add a new task..."}
                    className="flex-grow p-2 bg-white rounded-md border border-gray-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={tasks.length >= 3}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={tasks.length >= 3 || !newTask.trim()}
                  >
                    +
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access - 1 column, square shape */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6">
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

            {/* Vocabulary */}
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
          </div>
        </div>

        {/* Goal Tracker */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl font-semibold">✅ Goal Tracker</span>
            </div>

            {/* Goal Type Selector */}
            <div className="flex space-x-2 mb-8">
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

            {/* Sprint View */}
            {activeGoalView === 'sprint' && (
              <div className="space-y-4">
                {sprintGoals.map(goal => (
                  <div key={goal.id} className="group relative pr-8">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium">{goal.name}</span>
                      <div className="flex items-center">
                        <span>{goal.progress}%</span>
                        <button
                          onClick={() => handleOpenEditGoalModal(goal, 'sprint')}
                          className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                          aria-label="Edit sprint goal"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                  </div>
                ))}
                <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="Add a new sprint goal..."
                      className="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                    />
                    <button 
                      type="submit"
                      className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400"
                      disabled={!newGoalName.trim()}
                    >
                      Add Goal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vision View */}
            {activeGoalView === 'vision' && (
              <div className="space-y-4">
                {visionGoals.map(goal => (
                  <div key={goal.id} className="group relative pr-8">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium">{goal.name}</span>
                      <div className="flex items-center">
                        <span>{goal.progress}%</span>
                        <button
                          onClick={() => handleOpenEditGoalModal(goal, 'vision')}
                          className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                          aria-label="Edit vision goal"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                  </div>
                ))}
                <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="Add a new vision goal..."
                      className="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                    />
                    <button 
                      type="submit"
                      className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400"
                      disabled={!newGoalName.trim()}
                    >
                      Add Goal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Mind Fuel */}
        <div className="lg:col-span-1">
          <div className="bg-yellow-50 rounded-xl p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-semibold">💡 Mind Fuel</span>
            </div>

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
        </div>

        {/* Today's Progress */}
        <div className="lg:col-span-3">
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
      </div>

      {/* Edit Goal Modal */} 
      {isEditGoalModalOpen && editingGoal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Update Progress</h3>
            
            {/* Display Goal Name (Read-only) */} 
            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-500 mb-1">
                Goal
              </p>
              <p className="text-lg font-semibold text-gray-800">{editingGoal.name}</p>
            </div>

            {/* Goal Progress Slider */} 
            <div className="mb-6">
              <label htmlFor="goalProgress" className="block text-sm font-medium text-gray-700 mb-1">
                Progress: {editedGoalProgress}%
              </label>
              <input
                id="goalProgress"
                type="range"
                min="0"
                max="100"
                step="1"
                value={editedGoalProgress}
                onChange={(e) => setEditedGoalProgress(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditGoalModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGoal}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
