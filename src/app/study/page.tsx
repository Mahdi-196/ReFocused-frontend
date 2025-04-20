"use client";

// src/app/study/page.tsx
import React, { useState, useEffect } from "react";
import Pomodoro from "@/components/pomodoro";
import QuickNotes from "@/components/QuickNotes";

type Card = {
  id: string;
  front: string;
  back: string;
};

type StudySet = {
  id: string;
  name: string;
  cards: Card[];
};

type ModalType = 'newSet' | 'editSet' | 'addCard' | null;

export default function StudyPage() {
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M'>('D');
  const [currentCard, setCurrentCard] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [newSetName, setNewSetName] = useState('');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [newCard, setNewCard] = useState<{ front: string; back: string }>({
    front: '',
    back: ''
  });

  // Load study sets from localStorage on mount and save whenever they change
  useEffect(() => {
    const savedSets = localStorage.getItem('studySets');
    if (savedSets) {
      const parsed = JSON.parse(savedSets);
      setStudySets(parsed);
      if (parsed.length > 0 && !selectedSetId) {
        setSelectedSetId(parsed[0].id);
      }
    }
  }, []);

  useEffect(() => {
    if (studySets.length > 0) {
      localStorage.setItem('studySets', JSON.stringify(studySets));
    }
  }, [studySets]);

  const selectedSet = studySets.find(set => set.id === selectedSetId);

  // Function to handle adding a new set
  const handleAddSet = () => {
    if (!newSetName.trim()) return;
    
    const newSet: StudySet = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSetName.trim(),
      cards: []
    };
    
    setStudySets(prev => [...prev, newSet]);
    setSelectedSetId(newSet.id);
    setNewSetName('');
    setModalOpen(null);
  };

  // Function to handle editing a set name
  const handleEditSet = () => {
    if (!newSetName.trim() || !editingSetId) return;
    
    setStudySets(prev =>
      prev.map(set =>
        set.id === editingSetId
          ? { ...set, name: newSetName.trim() }
          : set
      )
    );
    
    setNewSetName('');
    setEditingSetId(null);
    setModalOpen(null);
  };

  // Function to handle adding a new card
  const handleAddCard = () => {
    if (!selectedSetId || !newCard.front.trim()) return;
    
    const newCardWithId = {
      id: Math.random().toString(36).substr(2, 9),
      front: newCard.front.trim(),
      back: newCard.back.trim()
    };
    
    setStudySets(prev =>
      prev.map(set =>
        set.id === selectedSetId
          ? { ...set, cards: [...set.cards, newCardWithId] }
          : set
      )
    );
    
    setNewCard({ front: '', back: '' });
    setModalOpen(null);
  };

  // Function to delete a card
  const handleDeleteCard = (cardId: string) => {
    if (!selectedSetId) return;
    
    setStudySets(prev =>
      prev.map(set =>
        set.id === selectedSetId
          ? { ...set, cards: set.cards.filter(card => card.id !== cardId) }
          : set
      )
    );
    
    setCurrentCard(1);
  };

  // Function to handle next card
  const handleNextCard = () => {
    if (!selectedSet?.cards.length) return;
    setCurrentCard(prev => {
      if (prev >= selectedSet.cards.length) return 1;
      return prev + 1;
    });
    setIsFlipped(false);
  };

  // Function to handle previous card
  const handlePrevCard = () => {
    if (!selectedSet?.cards.length) return;
    setCurrentCard(prev => {
      if (prev <= 1) return selectedSet.cards.length;
      return prev - 1;
    });
    setIsFlipped(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 relative z-50">
      <div className="container mx-auto px-4 relative z-50">
        {/* Pomodoro Timer Section */}
        <section className="mb-12">
          <Pomodoro />
        </section>

        {/* Quick Notes Section */}
        <section className="mb-12">
          <QuickNotes />
        </section>

        {/* Study Tools Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Study Sets Panel */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Study Sets</h2>
                <button 
                  onClick={() => {
                    setNewSetName('');
                    setModalOpen('newSet');
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm active:scale-95 transform transition-all duration-75"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Set
                </button>
              </div>
              
              {/* Study Sets List */}
              <div className="space-y-2">
                {studySets.map(set => (
                  <div
                    key={set.id}
                    className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors ${
                      selectedSetId === set.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedSetId(set.id)}
                        className="flex-1 text-left active:scale-95 transform transition-transform duration-75"
                      >
                        <div className="flex items-center justify-between">
                          <span>{set.name}</span>
                          <span className="text-sm text-gray-500">{set.cards.length} cards</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSetId(set.id);
                          setNewSetName(set.name);
                          setModalOpen('editSet');
                        }}
                        className="ml-2 p-1.5 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flashcards Display */}
            <div className="col-span-2 bg-white rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">{selectedSet?.name || 'Select a Set'}</h2>
                <button 
                  onClick={() => {
                    setNewCard({ front: '', back: '' });
                    setModalOpen('addCard');
                  }}
                  disabled={!selectedSetId}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm active:scale-95 transform transition-all duration-75"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Card
                </button>
              </div>

              {/* Flashcard Display */}
              {selectedSet?.cards.length ? (
                <div 
                  className="relative w-3/4 h-[270px] min-h-[270px] mx-auto mb-3 cursor-pointer select-none perspective-1000"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front of card */} 
                  <div 
                    className={`absolute inset-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-8 shadow-md transition-all duration-500 transform ${
                      isFlipped ? 'opacity-0 -rotate-y-90' : 'opacity-100 rotate-y-0'
                    }`}
                  >
                    <p className="text-xl text-center">{selectedSet?.cards[currentCard - 1]?.front}</p>
                  </div>
                  {/* Back of card */} 
                  <div 
                    className={`absolute inset-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-8 shadow-md transition-all duration-500 transform ${
                      isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-90'
                    }`}
                  >
                    <p className="text-xl text-center">{selectedSet?.cards[currentCard - 1]?.back}</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-[270px] border border-gray-200 rounded-lg mb-3 flex items-center justify-center">
                  <p className="text-gray-500">No cards yet. Click "Add Card" to get started!</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mb-3">
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
                  disabled={!selectedSet?.cards.length}
                  onClick={handlePrevCard}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm text-gray-600">
                  {selectedSet?.cards.length ? `${currentCard} of ${selectedSet.cards.length}` : '0 cards'}
                </p>
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
                  disabled={!selectedSet?.cards.length}
                  onClick={handleNextCard}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Delete Button */}
              {selectedSet?.cards.length ? (
                <div className="flex justify-center">
                  <button 
                    onClick={() => handleDeleteCard(selectedSet.cards[currentCard - 1].id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm active:scale-95 transform transition-all duration-75"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Card
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Summary Cards Section */}
        <section>
          {/* Time Period Toggle */}
          <div className="flex mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button 
                onClick={() => setTimeFilter('D')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === 'D' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                D
              </button>
              <button 
                onClick={() => setTimeFilter('W')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === 'W' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                W
              </button>
              <button 
                onClick={() => setTimeFilter('M')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === 'M' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                M
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Focus Time Card */}
            <div className="bg-white shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm text-gray-600 mb-1">Focus Time</h4>
              <p className="text-2xl font-bold">0h 0m</p>
            </div>

            {/* Sessions Card */}
            <div className="bg-white shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-sm text-gray-600 mb-1">Sessions</h4>
              <p className="text-2xl font-bold">0</p>
            </div>

            {/* Tasks Done Card */}
            <div className="bg-white shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h4 className="text-sm text-gray-600 mb-1">Tasks Done</h4>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </section>

        {/* Modals */}
        {modalOpen === 'newSet' && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Set</h3>
              <input
                type="text"
                placeholder="Enter set name"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddSet()}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalOpen(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md active:scale-95 transform transition-transform duration-75"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSet}
                  disabled={!newSetName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOpen === 'editSet' && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Set Name</h3>
              <input
                type="text"
                placeholder="Enter new name"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleEditSet()}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setModalOpen(null);
                    setEditingSetId(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md active:scale-95 transform transition-transform duration-75"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSet}
                  disabled={!newSetName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOpen === 'addCard' && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Front
                  </label>
                  <input
                    type="text"
                    placeholder="Enter front side text"
                    value={newCard.front}
                    onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Back
                  </label>
                  <input
                    type="text"
                    placeholder="Enter back side text"
                    value={newCard.back}
                    onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setModalOpen(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md active:scale-95 transform transition-transform duration-75"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  disabled={!newCard.front.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
