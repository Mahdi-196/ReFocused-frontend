"use client";

import React from 'react';

type ModalType = 'newSet' | 'editSet' | 'addCard' | 'deleteCard' | 'deleteSet' | null;

interface StudyModalsProps {
  modalOpen: ModalType;
  setModalOpen: (modal: ModalType) => void;
  newSetName: string;
  setNewSetName: (name: string) => void;
  newCard: { front: string; back: string };
  setNewCard: (card: { front: string; back: string }) => void;
  editingSetId: string | null;
  setEditingSetId: (id: string | null) => void;
  onAddSet: () => void;
  onEditSet: () => void;
  onDeleteSet: () => void;
  onAddCard: () => void;
}

export default function StudyModals({
  modalOpen,
  setModalOpen,
  newSetName,
  setNewSetName,
  newCard,
  setNewCard,
  setEditingSetId,
  onAddSet,
  onEditSet,
  onDeleteSet,
  onAddCard
}: StudyModalsProps) {
  const handleCloseModal = () => {
    setModalOpen(null);
    setEditingSetId(null);
  };

  return (
    <>
      {/* New Set Modal */}
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
              onChange={(e) => setNewSetName(e.target.value.slice(0, 25))}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md mb-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && newSetName.trim() && onAddSet()}
            />
            <div className="text-xs text-gray-400 mb-4 text-right">
              {newSetName.length}/25 characters
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
              >
                Cancel
              </button>
              <button
                onClick={onAddSet}
                disabled={!newSetName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Set Modal */}
      {modalOpen === 'editSet' && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Set Name</h3>
            <input
              type="text"
              placeholder="Enter new name"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value.slice(0, 25))}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md mb-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onEditSet()}
            />
            <div className="text-xs text-gray-400 mb-4 text-right">
              {newSetName.length}/25 characters
            </div>
            <div className="flex justify-between">
              {/* Delete button on the left */}
              <button
                onClick={() => setModalOpen('deleteSet')}
                className="flex items-center gap-1 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md active:scale-95 transform transition-all duration-75"
                title="Delete study set"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
             
             {/* Cancel and Save buttons on the right */}
             <div className="flex gap-2">
               <button
                 onClick={handleCloseModal}
                 className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
               >
                 Cancel
               </button>
               <button
                 onClick={onEditSet}
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

     {/* Add Card Modal */}
     {modalOpen === 'addCard' && (
       <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
         <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
           <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
           <div className="mb-4">
             <label className="block text-sm text-gray-400 mb-1">Front</label>
             <textarea
               placeholder="Question or term"
               value={newCard.front}
                               onChange={(e) => setNewCard({ ...newCard, front: e.target.value.slice(0, 200) })}
               className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md resize-none h-24"
               autoFocus
             />
             <div className="text-xs text-gray-400 mt-1 text-right">
               {newCard.front.length}/200 characters
             </div>
           </div>
           <div className="mb-4">
             <label className="block text-sm text-gray-400 mb-1">Back</label>
             <textarea
               placeholder="Answer or definition"
               value={newCard.back}
                               onChange={(e) => setNewCard({ ...newCard, back: e.target.value.slice(0, 200) })}
               className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md resize-none h-24"
             />
             <div className="text-xs text-gray-400 mt-1 text-right">
               {newCard.back.length}/200 characters
             </div>
           </div>

           <div className="flex justify-end gap-2 mt-4">
             <button
               onClick={handleCloseModal}
               className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
             >
               Cancel
             </button>
             <button
               onClick={onAddCard}
               disabled={!newCard.front.trim()}
               className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 active:scale-95 transform transition-transform duration-75"
             >
               Add Card
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Delete Study Set Confirmation Modal */}
     {modalOpen === 'deleteSet' && (
       <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
         <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
           <div className="text-red-500 mb-2 flex justify-center">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <h3 className="text-lg font-semibold mb-2 text-center">Delete Study Set?</h3>
           <p className="text-gray-300 text-center mb-4">
             Are you sure you want to delete this study set and all its cards? This action cannot be undone.
           </p>
           
           <div className="flex justify-center gap-3">
             <button
               onClick={handleCloseModal}
               className="px-5 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
             >
               Cancel
             </button>
             <button
               onClick={onDeleteSet}
               className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:scale-95 transform transition-transform duration-75"
             >
               Delete
             </button>
           </div>
         </div>
       </div>
     )}
   </>
 );
} 