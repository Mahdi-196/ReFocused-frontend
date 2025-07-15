"use client";

import { useState, useEffect } from 'react';
import client from "@/api/client";
import { getStudySets, createStudySet, updateStudySet, deleteStudySet, deleteCardFromSet } from "@/services/studyService";
import { STUDY } from '@/api/endpoints';

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

type ModalType = 'newSet' | 'editSet' | 'addCard' | 'deleteCard' | 'deleteSet' | null;

export function useStudyData() {
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

  // Load study sets using cached service
  useEffect(() => {
    if (!isClient) return;
    
    const loadStudySets = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 [STUDY PAGE] Loading study sets using cached service');
        const fetchedSets = await getStudySets();
        console.log('📚 [STUDY PAGE] Study sets loaded:', fetchedSets.length, 'sets');
        
        // Only update if we don't have any study sets yet (initial load)
        setStudySets(prevSets => {
          // If we already have sets (from optimistic updates), merge with server data
          if (prevSets.length > 0) {
            const mergedSets = [...prevSets];
            
            // Update any real sets from server, keep optimistic ones
            fetchedSets.forEach(serverSet => {
              const existingIndex = mergedSets.findIndex(set => set.id === serverSet.id);
              if (existingIndex !== -1) {
                mergedSets[existingIndex] = serverSet;
              } else {
                // Add new sets from server that aren't optimistic
                if (!mergedSets.some(set => set.name === serverSet.name)) {
                  mergedSets.push(serverSet);
                }
              }
            });
            
            return mergedSets;
          }
          
          // Initial load - use server data
          return fetchedSets;
        });
        
        // Set initial selected set only on first load
        setSelectedSetId(prevId => {
          if (!prevId && fetchedSets.length > 0) {
            return fetchedSets[0].id;
          }
          return prevId;
        });
      } catch (error) {
        console.error('Failed to load study sets:', error);
        setError('Failed to load study sets from server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudySets();
  }, [isClient]);

  const selectedSet = studySets.find(set => set.id === selectedSetId);

  // Function to refresh study sets from server
  const refreshStudySets = async () => {
    try {
      console.log('🔄 [STUDY PAGE] Refreshing study sets from server');
      const fetchedSets = await getStudySets();
      setStudySets(fetchedSets);
      
      // Ensure selected set is still valid
      if (selectedSetId && !fetchedSets.find(set => set.id === selectedSetId)) {
        if (fetchedSets.length > 0) {
          setSelectedSetId(fetchedSets[0].id);
        } else {
          setSelectedSetId(null);
        }
      }
    } catch (error) {
      console.error('Failed to refresh study sets:', error);
      setError('Failed to refresh study sets from server.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to handle adding a new set
  const handleAddSet = async () => {
    if (!newSetName.trim() || !userId) return;
    
    try {
      const optimisticSet: StudySet = {
        id: `temp-${Date.now()}`,
        name: newSetName.trim(),
        cards: [],
        user_id: userId ? parseInt(userId) : undefined,
        last_updated: new Date().toISOString()
      };
      
      // Clear form and close modal immediately for better UX
      const setName = newSetName.trim();
      setNewSetName('');
      setModalOpen(null);
      
      // Optimistic update
      setStudySets(prevSets => [...prevSets, optimisticSet]);
      setSelectedSetId(optimisticSet.id);
      
      const payload = {
        title: setName,
        cards: []
      };
      
      console.log('Creating new study set:', payload);
      
      try {
        const createdSet = await createStudySet(payload);
        console.log('✅ Study set created:', createdSet);
        
        // Replace optimistic set with real set
        setStudySets(prevSets => 
          prevSets.map(set => 
            set.id === optimisticSet.id ? createdSet : set
          )
        );
        
        // Update selected ID if it was the optimistic one
        setSelectedSetId(prevId => 
          prevId === optimisticSet.id ? createdSet.id : prevId
        );
        
      } catch (serverError) {
        console.error('Failed to create study set on server:', serverError);
        setError('Failed to save to server. Please try again.');
        
        // Revert optimistic update
        setStudySets(prevSets => prevSets.filter(set => set.id !== optimisticSet.id));
        
        // Reset selection if needed
        setSelectedSetId(prevId => {
          if (prevId === optimisticSet.id) {
            const remainingSets = studySets.filter(set => set.id !== optimisticSet.id);
            return remainingSets.length > 0 ? remainingSets[0].id : null;
          }
          return prevId;
        });
        
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Failed to create study set:', error);
      setError('Failed to create study set. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to handle editing a set name
  const handleEditSet = async () => {
    if (!newSetName.trim() || !editingSetId || !userId) return;
    
    try {
      const existingSet = studySets.find(set => set.id === editingSetId);
      if (!existingSet) return;
      
      const payload = {
        title: newSetName.trim(),
        cards: existingSet.cards.map(card => ({
          front_content: card.front,
          back_content: card.back
        }))
      };
      
      console.log('Updating study set:', payload);
      const updatedSet = await updateStudySet(editingSetId, payload);
      console.log('✅ Study set updated:', updatedSet);
      
      const updatedSets = studySets.map(set =>
        set.id === editingSetId ? updatedSet : set
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
      console.log('Deleting study set:', editingSetId);
      await deleteStudySet(editingSetId);
      console.log('✅ Study set deleted successfully');
      
      const updatedSets = studySets.filter(set => set.id !== editingSetId);
      setStudySets(updatedSets);
      
      if (selectedSetId === editingSetId) {
        if (updatedSets.length > 0) {
          setSelectedSetId(updatedSets[0].id);
        } else {
          setSelectedSetId(null);
        }
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
      const optimisticCard = {
        id: `temp-${Date.now()}`,
        front: newCard.front.trim(),
        back: newCard.back.trim()
      };
      
      const updatedSets = studySets.map(set =>
        set.id === selectedSetId
          ? { 
              ...set, 
              cards: [...set.cards, optimisticCard],
              last_updated: new Date().toISOString()
            }
          : set
      );
      
      setStudySets(updatedSets);
      setNewCard({ front: '', back: '' });
      setModalOpen(null);
      
      const cardPayload = {
        study_set_id: parseInt(selectedSetId),
        front_content: optimisticCard.front,
        back_content: optimisticCard.back
      };
      
      console.log('Adding card to study set:', cardPayload);
      
      try {
        const response = await client.post(STUDY.CARDS(selectedSetId), cardPayload);
        console.log('Card added response:', response.data);
        
        if (response.data && response.data.id) {
          const backendId = response.data.id.toString();
          
          setStudySets(prevSets => 
            prevSets.map(set => 
              set.id === selectedSetId
                ? {
                    ...set,
                    cards: set.cards.map(card => 
                      card.id === optimisticCard.id 
                        ? { ...card, id: backendId } 
                        : card
                    )
                  }
                : set
            )
          );
        }
      } catch (error) {
        console.error('Failed to save card to backend:', error);
        setError('Failed to save card to server.');
        
        setStudySets(prevSets => 
          prevSets.map(set => 
            set.id === selectedSetId
              ? {
                  ...set,
                  cards: set.cards.filter(card => card.id !== optimisticCard.id)
                }
              : set
          )
        );
        
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Failed to add card:', error);
      setError('Failed to add card. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to delete a card
  const handleDeleteCard = async (cardId: string) => {
    if (!selectedSetId || !userId) return;
    
    try {
      const cardToDelete = studySets
        .find(set => set.id === selectedSetId)
        ?.cards.find(card => card.id === cardId);
      
      if (!cardToDelete) return;
      
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
      
      if (!cardId.startsWith('temp-')) {
        console.log('Deleting card from backend:', cardId);
        
        try {
          await deleteCardFromSet(selectedSetId, cardId);
          console.log('✅ Card deleted successfully');
        } catch (error) {
          console.error('Failed to delete card from server:', error);
          setError('Failed to delete card from server.');
          
          if (cardToDelete) {
            setStudySets(prevSets => 
              prevSets.map(set => 
                set.id === selectedSetId
                  ? {
                      ...set,
                      cards: [...set.cards, cardToDelete]
                    }
                  : set
              )
            );
          }
          
          setTimeout(() => setError(null), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      setError('Failed to delete card. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Modal handlers
  const openNewSetModal = () => {
    setNewSetName('');
    setModalOpen('newSet');
  };

  const openEditSetModal = (setId: string, setName: string) => {
    setEditingSetId(setId);
    setNewSetName(setName);
    setModalOpen('editSet');
  };

  const openAddCardModal = () => {
    setNewCard({ front: '', back: '' });
    setModalOpen('addCard');
  };

  return {
    // State
    selectedSetId,
    studySets,
    selectedSet,
    modalOpen,
    newSetName,
    editingSetId,
    newCard,
    isLoading,
    error,
    
    // Setters
    setSelectedSetId,
    setModalOpen,
    setNewSetName,
    setNewCard,
    setEditingSetId,
    
    // Handlers
    handleAddSet,
    handleEditSet,
    handleDeleteSet,
    handleAddCard,
    handleDeleteCard,
    refreshStudySets,
    
    // Modal handlers
    openNewSetModal,
    openEditSetModal,
    openAddCardModal
  };
} 