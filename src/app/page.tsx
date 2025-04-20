"use client";

import { useState } from 'react';
import DailyMomentum from './homeComponents/DailyMomentum';
import QuickAccess from './homeComponents/QuickAccess';
import WordOfTheDay from './homeComponents/WordOfTheDay';
import GoalTracker, { Goal, GoalView } from './homeComponents/GoalTracker';
import MindFuel from './homeComponents/MindFuel';
import ProductivityScore from './homeComponents/ProductivityScore';
import { Task } from './homeComponents/TaskList';

const Home = () => {
  const [activeGoalView, setActiveGoalView] = useState<GoalView>('sprint');
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Complete project meeting', completed: false },
    { id: 2, text: 'Write documentation', completed: false },
    { id: 3, text: 'Update sprint board', completed: false },
  ]);

  const [sprintGoals, setSprintGoals] = useState<Goal[]>([
    { id: 201, name: 'Implement new features', progress: 45 },
    { id: 202, name: 'Code refactoring', progress: 80 },
  ]);
  const [visionGoals, setVisionGoals] = useState<Goal[]>([
    { id: 301, name: 'Launch MVP', progress: 25 },
    { id: 302, name: 'Grow user base', progress: 15 },
  ]);
  const [newGoalName, setNewGoalName] = useState('');

  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
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
    const newGoal: Goal = { id: Date.now(), name: newGoalName.trim(), progress: 0 };
    if (activeGoalView === 'sprint') {
      setSprintGoals([...sprintGoals, newGoal]);
    } else {
      setVisionGoals([...visionGoals, newGoal]);
    }
    setNewGoalName('');
  };

  const handleOpenEditGoalModal = (goal: Goal, type: 'sprint' | 'vision') => {
    setEditingGoal({ ...goal, type });
    setEditedGoalProgress(goal.progress);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    const updatedGoal = { ...editingGoal, progress: editedGoalProgress };
    const { type, ...goalToUpdate } = updatedGoal;

    if (editingGoal.type === 'sprint') {
      setSprintGoals(sprintGoals.map(g => g.id === editingGoal.id ? goalToUpdate : g));
    } else {
      setVisionGoals(visionGoals.map(g => g.id === editingGoal.id ? goalToUpdate : g));
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
        <DailyMomentum
          tasks={tasks}
          newTask={newTask}
          setNewTask={setNewTask}
          handleAddTask={handleAddTask}
          handleDeleteTask={handleDeleteTask}
          setTasks={setTasks}
        />

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6">
            <QuickAccess />
            <WordOfTheDay />
          </div>
        </div>

        <GoalTracker
          sprintGoals={sprintGoals}
          visionGoals={visionGoals}
          activeGoalView={activeGoalView}
          setActiveGoalView={setActiveGoalView}
          newGoalName={newGoalName}
          setNewGoalName={setNewGoalName}
          handleAddGoal={handleAddGoal}
          handleOpenEditGoalModal={handleOpenEditGoalModal}
        />

        <MindFuel />

        <ProductivityScore />
      </div>

      {isEditGoalModalOpen && editingGoal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Update Progress</h3>
            
            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-500 mb-1">Goal</p>
              <p className="text-lg font-semibold text-gray-800">{editingGoal.name}</p>
            </div>

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
