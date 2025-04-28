"use client";

import { useState, useEffect } from 'react';
import DailyMomentum from './homeComponents/DailyMomentum';
import QuickAccess from './homeComponents/QuickAccess';
import WordOfTheDay from './homeComponents/WordOfTheDay';
import GoalTracker, { Goal, GoalView } from './homeComponents/GoalTracker';
import MindFuel from './homeComponents/MindFuel';
import ProductivityScore from './homeComponents/ProductivityScore';
import { Task } from './homeComponents/TaskList';
import client from '@/api/client';

const Home = () => {
  const [activeGoalView, setActiveGoalView] = useState<GoalView>('sprint');
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Complete project meeting', completed: false },
    { id: 2, text: 'Write documentation', completed: false },
    { id: 3, text: 'Update sprint board', completed: false },
  ]);

  const [sprintGoals, setSprintGoals] = useState<Goal[]>([]);
  const [visionGoals, setVisionGoals] = useState<Goal[]>([]);
  const [newGoalName, setNewGoalName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch goals from the API
  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);

      try {
        const res = await client.get<Goal[]>("/goals");
        setSprintGoals(res.data.filter(g => g.type === "sprint" || g.category === "sprint"));
        setVisionGoals(res.data.filter(g => g.type === "vision" || g.category === "long_term"));
      } catch (error) {
        console.error("Error fetching goals:", error);
        // Fallback to default goals if API fails
        setSprintGoals([
          { id: 201, name: 'Implement new features', progress: 45, type: 'sprint', category: 'sprint' },
          { id: 202, name: 'Code refactoring', progress: 80, type: 'sprint', category: 'sprint' },
        ]);
        setVisionGoals([
          { id: 301, name: 'Launch MVP', progress: 25, type: 'vision', category: 'long_term' },
          { id: 302, name: 'Grow user base', progress: 15, type: 'vision', category: 'long_term' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

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

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    
    const category = activeGoalView === 'sprint' ? 'sprint' : 'long_term';
    
    try {
      const response = await client.post('/goals', {
        category, 
        goal_text: newGoalName.trim()
      });
      
      const newGoal = response.data;
      
      if (category === 'sprint') {
        setSprintGoals([...sprintGoals, newGoal]);
      } else {
        setVisionGoals([...visionGoals, newGoal]);
      }
      
      setNewGoalName('');
    } catch (error) {
      console.error('Error adding goal:', error);
      // Fallback to local-only logic if API fails
      const localGoal: Goal = { 
        id: Date.now(), 
        name: newGoalName.trim(), 
        progress: 0,
        type: category === 'sprint' ? 'sprint' : 'vision',
        category
      };
      
      if (category === 'sprint') {
        setSprintGoals([...sprintGoals, localGoal]);
      } else {
        setVisionGoals([...visionGoals, localGoal]);
      }
      setNewGoalName('');
    }
  };

  const handleOpenEditGoalModal = (goal: Goal, type: 'sprint' | 'vision') => {
    setEditingGoal({ ...goal, type });
    setEditedGoalProgress(goal.progress);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    // Convert UI type to API category
    const category = editingGoal.type === 'sprint' ? 'sprint' : 'long_term';
    
    try {
      const response = await client.patch(`/goals/${editingGoal.id}`, {
        goal_text: editingGoal.name,
        completed: editedGoalProgress === 100,
        progress: editedGoalProgress,
        category
      });
      
      const updatedGoal = response.data;
      
      if (editingGoal.type === 'sprint') {
        setSprintGoals(sprintGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      } else {
        setVisionGoals(visionGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      // Fallback to local-only logic if API fails
      const localGoalUpdate: Goal = {
        id: editingGoal.id,
        name: editingGoal.name,
        progress: editedGoalProgress,
        type: editingGoal.type,
        category: editingGoal.type === 'sprint' ? 'sprint' : 'long_term'
      };
      
      if (editingGoal.type === 'sprint') {
        setSprintGoals(sprintGoals.map(g => g.id === editingGoal.id ? localGoalUpdate : g));
      } else {
        setVisionGoals(visionGoals.map(g => g.id === editingGoal.id ? localGoalUpdate : g));
      }
    } finally {
      setIsEditGoalModalOpen(false);
      setEditingGoal(null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleDeleteGoal = async (id: number, type: 'sprint' | 'vision') => {
    try {
      await client.delete(`/goals/${id}`);
      
      // On success, filter out the deleted goal from state
      if (type === 'sprint') {
        setSprintGoals(sprintGoals.filter(goal => goal.id !== id));
      } else {
        setVisionGoals(visionGoals.filter(goal => goal.id !== id));
      }
    } catch (error) {
      console.error(`Error deleting goal with id ${id}:`, error);
    }
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
          handleDeleteGoal={handleDeleteGoal}
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
