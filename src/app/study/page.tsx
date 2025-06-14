"use client";

// src/app/study/page.tsx
import React, { useState, useEffect, useCallback } from "react";
import Pomodoro from "@/components/pomodoro";
import QuickNotes from "@/components/QuickNotes";
import PageTransition from '@/components/PageTransition';
import AuthGuard from '@/components/AuthGuard';
import client from "@/api/client";

type Card = {
  id: string;
  front: string;
  back: string;
};

type StudySet = {
  id: string;
  name: string;
  cards: Card[];
  user_id?: string | number;
  last_updated?: string;
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
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Load study sets from API on mount
  useEffect(() => {
    if (!isClient) return;
    setIsLoading(true);
    
    const loadStudySets = async () => {
      try {
        if (userId) {
          // Load from API if user is logged in
          try {
            console.log('Attempting to load study sets from API');
            const response = await client.get('/api/v1/study/sets');
            console.log('API response:', response.data);
            
            if (response.status === 200 && response.data) {
              let fetchedSets: any[] = response.data;
              // Handle possible array wrapping
              if (!Array.isArray(fetchedSets) && fetchedSets.data && Array.isArray(fetchedSets.data)) {
                fetchedSets = fetchedSets.data;
              }
              
              if (Array.isArray(fetchedSets)) {
                // Transform the backend data format to our frontend format
                const transformedSets: StudySet[] = fetchedSets.map(set => ({
                  id: set.id.toString(),
                  name: set.title || 'Untitled Set',
                  cards: (set.cards || []).map((card: any) => ({
                    id: card.id.toString(),
                    front: card.front_content || '',
                    back: card.back_content || ''
                  })),
                  user_id: set.user_id,
                  last_updated: set.updated_at || set.created_at
                }));
                
                console.log('Transformed sets:', transformedSets);
                setStudySets(transformedSets);
                
                if (transformedSets.length > 0 && !selectedSetId) {
                  setSelectedSetId(transformedSets[0].id);
                }
              }
            }
          } catch (apiError) {
            console.error('Failed to load study sets from API:', apiError);
            setError('Failed to load study sets from server.');
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load study sets:', error);
        setError('Failed to load study sets');
        setIsLoading(false);
      }
    };

    loadStudySets();
  }, [isClient, userId, selectedSetId]);

  // Function to save study sets to backend
  const saveStudySets = useCallback(async (sets: StudySet[]) => {
    if (!isClient || !userId) return;
    
    try {
      console.log('Saving study sets to API:', sets);
      // Send each study set individually with proper structure
      for (const set of sets) {
        // Format the data according to what backend expects
        const payload = {
          title: set.name,
          cards: set.cards.map(card => ({
            front_content: card.front,
            back_content: card.back
          }))
        };
        console.log('Sending payload to API:', payload);
        await client.post('/api/v1/study/sets', payload);
      }
    } catch (error) {
      console.error('Failed to save study sets to API:', error);
      setError('Failed to save to server.');
    }
  }, [isClient, userId]);

  const selectedSet = studySets.find(set => set.id === selectedSetId);

  // Function to handle adding a new set
  const handleAddSet = async () => {
    if (!newSetName.trim() || !userId) return;
    
    try {
      // Create payload for backend
      const payload = {
        title: newSetName.trim(),
        cards: [] // New set has no cards initially
      };
      
      console.log('Creating new study set:', payload);
      const response = await client.post('/api/v1/study/sets', payload);
      console.log('API response:', response.data);
      
      // If the backend returns data, create a new set in our state
      if (response.data && response.data.id) {
        const newSet: StudySet = {
          id: response.data.id.toString(),
          name: newSetName.trim(),
          cards: [],
          user_id: userId ? parseInt(userId) : undefined,
          last_updated: new Date().toISOString()
        };
        
        // Add to local state for immediate UI update
        const updatedSets = [...studySets, newSet];
        setStudySets(updatedSets);
        setSelectedSetId(newSet.id);
      }
      
      setNewSetName('');
      setModalOpen(null);
    } catch (error) {
      console.error('Failed to create study set:', error);
      setError('Failed to create study set. Please try again.');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  // Function to handle editing a set name
  const handleEditSet = async () => {
    if (!newSetName.trim() || !editingSetId || !userId) return;
    
    try {
      // Get the existing set
      const existingSet = studySets.find(set => set.id === editingSetId);
      if (!existingSet) return;
      
      // Create payload for backend
      const payload = {
        title: newSetName.trim(),
        cards: existingSet.cards.map(card => ({
          front_content: card.front,
          back_content: card.back
        }))
      };
      
      console.log('Updating study set:', payload);
      const response = await client.put(`/api/v1/study/sets/${editingSetId}`, payload);
      console.log('API response:', response.data);
      
      // Update the local state
      const updatedSets = studySets.map(set =>
        set.id === editingSetId
          ? { 
              ...set, 
              name: newSetName.trim(), 
              last_updated: new Date().toISOString() 
            }
          : set
      );
      
      setStudySets(updatedSets);
      setNewSetName('');
      setEditingSetId(null);
      setModalOpen(null);
    } catch (error) {
      console.error('Failed to edit study set:', error);
      setError('Failed to update study set. Please try again.');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Function to handle deleting a study set
  const handleDeleteSet = async () => {
    if (!editingSetId || !userId) return;
    
    try {
      console.log('Deleting study set from API:', editingSetId);
      await client.delete(`/api/v1/study/sets/${editingSetId}`);
      console.log('Study set deleted successfully');
      
      const updatedSets = studySets.filter(set => set.id !== editingSetId);
      setStudySets(updatedSets);
      
      // If we're deleting the currently selected set, select the first available set or clear selection
      if (selectedSetId === editingSetId) {
        if (updatedSets.length > 0) {
          setSelectedSetId(updatedSets[0].id);
        } else {
          setSelectedSetId(null);
        }
        setCurrentCard(1);
        setIsFlipped(false);
      }
      
      setNewSetName('');
      setEditingSetId(null);
      setModalOpen(null);
    } catch (error) {
      console.error('Failed to delete study set:', error);
      setError('Failed to delete study set from server.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to handle adding a new card
  const handleAddCard = async () => {
    if (!selectedSetId || !newCard.front.trim() || !userId) return;
    
    try {
      // Format the card for the backend
      const cardPayload = {
        study_set_id: parseInt(selectedSetId),
        front_content: newCard.front.trim(),
        back_content: newCard.back.trim()
      };
      
      console.log('Adding card to study set:', cardPayload);
      const response = await client.post(`/api/v1/study/sets/${selectedSetId}/cards`, cardPayload);
      console.log('Card added response:', response.data);
      
      if (response.data && response.data.id) {
        const newCardWithId = {
          id: response.data.id.toString(),
          front: newCard.front.trim(),
          back: newCard.back.trim()
        };
        
        const updatedSets = studySets.map(set =>
          set.id === selectedSetId
            ? { 
                ...set, 
                cards: [...set.cards, newCardWithId],
                last_updated: new Date().toISOString()
              }
            : set
        );
        
        setStudySets(updatedSets);
        setNewCard({ front: '', back: '' });
        setModalOpen(null);
      }
    } catch (error) {
      console.error('Failed to save card to backend:', error);
      setError('Failed to save card to server.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to delete a card
  const handleDeleteCard = async (cardId: string) => {
    if (!selectedSetId) return;
    
    const updatedSets = studySets.map(set =>
      set.id === selectedSetId
        ? { 
            ...set, 
            cards: set.cards.filter(card => card.id !== cardId),
            last_updated: new Date().toISOString()
          }
        : set
    );
    
    setStudySets(updatedSets);
    setCurrentCard(1);
    
    try {
      await saveStudySets(updatedSets);
    } catch (error) {
      console.error('Failed to save after deleting card:', error);
    }
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
    <AuthGuard>
      <PageTransition>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4">
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
              <div 
                className="rounded-lg p-4 shadow-md"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Study Sets</h2>
                  <button 
                    onClick={() => {
                      setNewSetName('');
                      setModalOpen('newSet');
                      console.log('Opening new set modal');
                    }}
                    className="flex items-center gap-1 px-3 py-1 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm active:scale-95 transform transition-all duration-75 text-white"
                    aria-label="Create New Study Set"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Set
                  </button>
                </div>
                
                {/* Status Messages */}
                {isLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin h-5 w-5 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className="text-gray-300 text-sm">Loading study sets...</p>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-400 bg-red-900/20 p-2 rounded mb-2 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Study Sets List */}
                <div className="space-y-2">
                  {!isLoading && studySets.length === 0 && (
                    <p className="text-gray-300 text-center py-4">
                      No study sets yet. Create your first set!
                    </p>
                  )}
                  
                  {studySets.map(set => (
                    <div
                      key={set.id}
                      className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors ${
                        selectedSetId === set.id 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-300'
                      }`}
                    >
                      <div className="flex-1 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedSetId(set.id)}
                          className="flex-1 text-left active:scale-95 transform transition-transform duration-75"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-black">{set.name}</span>
                            <span className="text-sm text-black">{set.cards.length} cards</span>
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
              <div 
                className="col-span-2 rounded-lg p-4 shadow-md"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-white">{selectedSet?.name || 'Select a Set'}</h2>
                  <button 
                    onClick={() => {
                      setNewCard({ front: '', back: '' });
                      setModalOpen('addCard');
                    }}
                    disabled={!selectedSetId}
                    className="flex items-center gap-1 px-3 py-1 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm active:scale-95 transform transition-all duration-75 text-white disabled:opacity-50"
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
                      className={`absolute inset-0 border border-gray-200 rounded-lg flex items-center justify-center p-8 shadow-md transition-all duration-500 transform ${
                        isFlipped ? 'opacity-0 -rotate-y-90' : 'opacity-100 rotate-y-0'
                      }`}
                    >
                      <p className="text-xl text-center text-gray-300">{selectedSet?.cards[currentCard - 1]?.front}</p>
                    </div>
                    {/* Back of card */} 
                    <div 
                      className={`absolute inset-0 border border-gray-200 rounded-lg flex items-center justify-center p-8 shadow-md transition-all duration-500 transform ${
                        isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-90'
                      }`}
                    >
                      <p className="text-xl text-center text-gray-300">{selectedSet?.cards[currentCard - 1]?.back}</p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[270px] border border-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <p className="text-white">No cards yet. Click "Add Card" to get started!</p>
                  </div>
                )}

                {/* Navigation */}
                {selectedSet?.cards.length > 0 && (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 justify-between items-center">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDeleteCard(selectedSet.cards[currentCard - 1].id)}
                        className="px-3 py-1 border border-red-500 text-red-400 rounded hover:bg-red-900/30 active:scale-95 transform transition-all duration-75 text-sm"
                      >
                        Delete Card
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <button 
                        onClick={handlePrevCard}
                        className="p-2 hover:bg-gray-700 rounded-full active:scale-95 transform transition-all duration-75"
                        title="Previous card"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <span className="mx-4 text-white">
                        {currentCard} / {selectedSet.cards.length}
                      </span>
                      
                      <button 
                        onClick={handleNextCard}
                        className="p-2 hover:bg-gray-700 rounded-full active:scale-95 transform transition-all duration-75"
                        title="Next card"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div>
                      <button 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="px-3 py-1 border border-gray-400 text-gray-300 rounded hover:bg-gray-700 active:scale-95 transform transition-all duration-75 text-sm"
                      >
                        Flip Card
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            {/* Time Period Toggle */}
            <div className="flex mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 p-1">
                <button 
                  onClick={() => setTimeFilter('D')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'D' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
                  }`}
                >
                  D
                </button>
                <button 
                  onClick={() => setTimeFilter('W')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'W' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
                  }`}
                >
                  W
                </button>
                <button 
                  onClick={() => setTimeFilter('M')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'M' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
                  }`}
                >
                  M
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Focus Time Card */}
              <div 
                className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm text-gray-300 mb-1">Focus Time</h4>
                <p className="text-2xl font-bold text-white">0h 0m</p>
              </div>

              {/* Sessions Card */}
              <div 
                className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-sm text-gray-300 mb-1">Sessions</h4>
                <p className="text-2xl font-bold text-white">0</p>
              </div>

              {/* Tasks Done Card */}
              <div 
                className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="text-sm text-gray-300 mb-1">Tasks Done</h4>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </section>

          {/* Modals */}
          {modalOpen === 'newSet' && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div 
                className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Create New Study Set</h3>
                <input
                  type="text"
                  placeholder="Enter set name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && newSetName.trim() && handleAddSet()}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
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
              <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Edit Set Name</h3>
                <input
                  type="text"
                  placeholder="Enter new name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSet()}
                />
                <div className="flex justify-between">
                  {/* Delete button on the left */}
                  <button
                    onClick={handleDeleteSet}
                    className="flex items-center gap-1 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md active:scale-95 transform transition-all duration-75"
                    title="Delete study set"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  {/* Cancel and Save buttons on the right */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setModalOpen(null);
                        setEditingSetId(null);
                      }}
                      className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
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
            </div>
          )}

          {modalOpen === 'addCard' && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Front</label>
                  <textarea
                    placeholder="Question or term"
                    value={newCard.front}
                    onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md resize-none h-24"
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Back</label>
                  <textarea
                    placeholder="Answer or definition"
                    value={newCard.back}
                    onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md resize-none h-24"
                  />
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
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
    </PageTransition>
    </AuthGuard>
  );
}
