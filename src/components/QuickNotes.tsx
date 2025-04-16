"use client";

import React, { useState, useEffect } from "react";
import { Save, Trash2, Plus, Check } from "lucide-react";

export default function QuickNotes() {
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const savedNotes = localStorage.getItem("quickNotes");
    const savedTodos = localStorage.getItem("quickNotesTodos");
    if (savedNotes) setNotes(savedNotes);
    if (savedTodos) setTodos(JSON.parse(savedTodos));
  }, []);

  const handleSave = () => {
    localStorage.setItem("quickNotes", notes);
    localStorage.setItem("quickNotesTodos", JSON.stringify(todos));
  };

  const handleClear = () => {
    setNotes("");
    setTodos([]);
    localStorage.removeItem("quickNotes");
    localStorage.removeItem("quickNotesTodos");
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, newTodo.trim()]);
      setNewTodo("");
    }
  };

  const removeTodo = (index: number) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h3 className="text-xl font-semibold">Quick Notes & Todo</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            <Save className="inline mr-2 h-4 w-4" /> Save
          </button>
          <button
            onClick={handleClear}
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNotes(e.target.value)
            }
            className="w-full h-full min-h-[300px] p-4 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Todo Section */}
        <div className="w-full lg:w-1/5 flex flex-col gap-2">
          {/* Input box with button positioned inside */}
          <div className="relative w-full border border-gray-300 rounded-lg p-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add todo..."
              className="w-full py-2 px-3 pr-10 focus:outline-none rounded-lg"
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
            // Adjust max height to show about five items before scrolling.
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
          </div>
        </div>
      </div>
    </div>
  );
}
