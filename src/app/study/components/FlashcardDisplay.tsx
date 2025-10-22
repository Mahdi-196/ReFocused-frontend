"use client";

import React, { useState } from 'react';

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

interface FlashcardDisplayProps {
  selectedSet: StudySet | undefined;
  onAddCard: () => void;
  onDeleteCard: (cardId: string) => void;
}

export default function FlashcardDisplay({
  selectedSet,
  onAddCard,
  onDeleteCard
}: FlashcardDisplayProps) {
  const [currentCard, setCurrentCard] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset card position when set changes
  React.useEffect(() => {
    setCurrentCard(1);
    setIsFlipped(false);
  }, [selectedSet?.id]);

  const handleNextCard = () => {
    if (!selectedSet?.cards.length) return;
    setCurrentCard(prev => {
      if (prev >= selectedSet.cards.length) return 1;
      return prev + 1;
    });
    setIsFlipped(false);
  };

  const handlePrevCard = () => {
    if (!selectedSet?.cards.length) return;
    setCurrentCard(prev => {
      if (prev <= 1) return selectedSet.cards.length;
      return prev - 1;
    });
    setIsFlipped(false);
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDeleteCard = () => {
    if (selectedSet?.cards[currentCard - 1]) {
      onDeleteCard(selectedSet.cards[currentCard - 1].id);
      // Reset to first card after deletion
      setCurrentCard(1);
      setIsFlipped(false);
    }
  };

  return (
    <div 
      className="col-span-2 rounded-lg p-4 shadow-md"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex justify-between items-center mb-3 gap-3">
        <h2 className="text-lg font-semibold text-white truncate">
          {selectedSet?.name || 'Select a Set'}
        </h2>
        <button
          onClick={onAddCard}
          disabled={!selectedSet}
          className="flex items-center gap-1 px-3 py-1 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm active:scale-95 transform transition-all duration-75 text-white disabled:opacity-50 flex-shrink-0"
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
          className="w-3/4 h-[270px] min-h-[270px] mx-auto mb-3 cursor-pointer select-none flip-card-container"
          onClick={handleCardClick}
        >
          <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
            {/* Front of card */}
            <div className="flip-card-front border border-gray-200 p-8 overflow-hidden">
              <p className="text-xl text-center break-words overflow-auto max-h-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{selectedSet?.cards[currentCard - 1]?.front}</p>
            </div>
            {/* Back of card */}
            <div className="flip-card-back border border-gray-200 p-8 overflow-hidden">
              <p className="text-xl text-center break-words overflow-auto max-h-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{selectedSet?.cards[currentCard - 1]?.back}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[270px] border border-gray-200 rounded-lg mb-3 flex items-center justify-center">
          <p className="text-white">No cards yet. Click "Add Card" to get started!</p>
        </div>
      )}

      {/* Navigation */}
      {selectedSet?.cards && selectedSet.cards.length > 0 && (
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 justify-between items-center">
          <div>
            <button 
              onClick={handleDeleteCard}
              className="p-2 hover:bg-red-900/30 text-red-400 rounded-full"
              title="Delete card"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handlePrevCard}
              className="p-2 hover:bg-gray-700 rounded-full"
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
              className="p-2 hover:bg-gray-700 rounded-full"
              title="Next card"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="w-8"></div> {/* Empty div for layout balance */}
        </div>
      )}
    </div>
  );
} 