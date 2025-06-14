"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Check } from "lucide-react";
import client from "@/api/client";

type UserNotesData = {
  notes: string;
  todos: string[];
  lastUpdated: number;
};

export default function QuickNotes() {
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load user ID from localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      const userDataString = localStorage.getItem('REF_USER');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserId(userData.id?.toString());
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [isClient]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess !== null) {
      const timer = setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      // First try to load from localStorage
      const storedDataString = localStorage.getItem("userQuickNotes");
      
      if (storedDataString) {
        const storedData: UserNotesData = JSON.parse(storedDataString);
        
        // Check if data is less than 24 hours old
        const now = Date.now();
        const isExpired = now - storedData.lastUpdated > 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          setNotes(storedData.notes);
          setTodos(storedData.todos);
          return;
        }
      }

      // If local data doesn't exist or is expired, try to fetch from API
      loadUserDataFromApi();
    } catch (error) {
      console.error('Failed to load notes data:', error);
    }
  }, [isClient, userId]);

  const loadUserDataFromApi = async () => {
    if (!userId) return;
    
    try {
      const response = await client.get(`/api/v1/user/notes`);
      
      if (response.data && response.data.notes !== undefined) {
        setNotes(response.data.notes);
        setTodos(response.data.todos || []);
        
        // Save to localStorage with timestamp
        saveToLocalStorage(response.data.notes, response.data.todos || []);
      }
    } catch (error) {
      console.error('Failed to load notes from API:', error);
      // If API fails, just continue with current state - the local storage data will be used
    }
  };

  const saveToLocalStorage = (notesData = notes, todosData = todos) => {
    if (!isClient) return;
    
    try {
      const userData: UserNotesData = {
        notes: notesData,
        todos: todosData,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem("userQuickNotes", JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
      return false;
    }
  };

  const saveToApi = async () => {
    if (!isClient) return;
    
    try {
      setIsSaving(true);
      
      // Always save to localStorage first
      saveToLocalStorage();
      
      if (userId) {
        try {
          // Try to save to API if user is logged in
          await client.post('/api/v1/user/notes', {
            notes,
            todos
          });
          setSaveSuccess(true);
        } catch (apiError) {
          console.error('Failed to save notes to API:', apiError);
          // API save failed but local save succeeded
          setSaveSuccess(true);
        }
      } else {
        // No user ID but local storage save succeeded
        setSaveSuccess(true); 
      }
      
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      setSaveSuccess(false);
      setIsSaving(false);
    }
  };

  // Debounced save function - save after user stops typing
  const debouncedSave = useCallback((notesContent: string, todosContent: string[]) => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout for 1 second
    const timeout = setTimeout(() => {
      saveToLocalStorage(notesContent, todosContent);
      saveToApi();
    }, 1000);
    
    setSaveTimeout(timeout);
  }, [saveTimeout, saveToApi]);

  const clearAllData = async () => {
    if (!isClient) return;
    
    setNotes("");
    setTodos([]);
    
    try {
      // Clear from localStorage
      localStorage.removeItem("userQuickNotes");
      
      // Clear from API if user is logged in
      if (userId) {
        try {
          await client.post('/api/v1/user/notes', {
            notes: "",
            todos: []
          });
        } catch (apiError) {
          console.error('Failed to clear notes from API:', apiError);
        }
      }
    } catch (error) {
      console.error('Failed to clear notes:', error);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const updatedTodos = [...todos, newTodo.trim()];
      setTodos(updatedTodos);
      setNewTodo("");
      debouncedSave(notes, updatedTodos);
    }
  };

  const removeTodo = (index: number) => {
    const updatedTodos = todos.filter((_, i) => i !== index);
    setTodos(updatedTodos);
    debouncedSave(notes, updatedTodos);
  };

  return (
    <div 
      className="shadow rounded-lg p-6 w-full max-w-6xl mx-auto"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h3 className="text-xl font-semibold text-white">Quick Notes & Todo</h3>
        <div className="flex gap-2 items-center">
          {saveSuccess !== null && (
            <span className={`text-sm ${saveSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {saveSuccess ? 'Saved successfully!' : 'Save failed.'}
            </span>
          )}
          <button
            onClick={clearAllData}
            className="px-3 py-1 border rounded bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="inline mr-2 h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
        {/* Quick Notes Textarea */}
        <div className="w-full lg:w-4/5">
          <textarea
            placeholder="Type your quick notes here..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const newNotes = e.target.value;
              setNotes(newNotes);
              debouncedSave(newNotes, todos);
            }}
            className="w-full h-full min-h-[300px] p-4 border border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                       bg-gray-700 text-white placeholder-gray-300"
          />
        </div>

        {/* Todo Section */}
        <div className="w-full lg:w-1/5 flex flex-col gap-2">
          {/* Input box with button positioned inside */}
          <div className="relative w-full border border-gray-600 rounded-lg p-2 bg-gray-700">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add todo..."
              className="w-full py-2 px-3 pr-10 focus:outline-none rounded-lg bg-gray-700 text-white placeholder-gray-300"
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
            />
            <button
              onClick={addTodo}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 
                         bg-blue-500 text-white hover:bg-blue-600 rounded px-2 py-1"
              aria-label="Add todo"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {/* Todo List */}
          <div
            className="overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2 max-h-60 bg-white"
          >
            {todos.map((todo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 
                           rounded hover:bg-gray-100"
              >
                <span className="text-sm break-words">{todo}</span>
                <button
                  onClick={() => removeTodo(index)}
                  className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ))}
            {todos.length === 0 && (
              <div className="p-2 text-center text-gray-500 text-sm">
                No todos yet. Add one above!
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Notes save automatically and expire after 24hrs
          </div>
        </div>
      </div>
    </div>
  );
}
