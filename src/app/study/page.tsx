"use client";

import React, { useState } from "react";
import Pomodoro from "@/components/pomodoro";
import QuickNotes from "@/components/QuickNotes";
import AuthGuard from '@/components/AuthGuard';
import PageTransition from '@/components/PageTransition';
import { StudyPageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Import the new components
import StudySetsPanel from './components/StudySetsPanel';
import FlashcardDisplay from './components/FlashcardDisplay';
import StatisticsSection from './components/StatisticsSection';
import TestingSection from './components/TestingSection';
import StudyModals from './components/StudyModals';
import BackendDebugger from './components/BackendDebugger';

// Import the custom hooks
import { useStudyData } from './hooks/useStudyData';
import { useStatistics } from './hooks/useStatistics';

export default function StudyPage() {
  
  // Use custom hooks for data management
  const studyData = useStudyData();
  const statistics = useStatistics();
  
  // Local state for testing section
  const [showTesting, setShowTesting] = useState(false);

  return (
    <AuthGuard>
      <PageTransition>
        <SkeletonDemo
          skeleton={<StudyPageSkeleton />}
          delay={100} // Minimal delay for smooth transition
          enabled={false} // Disable forced demo mode
        >
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
                  <StudySetsPanel
                    studySets={studyData.studySets}
                    selectedSetId={studyData.selectedSetId}
                    isLoading={studyData.isLoading}
                    error={studyData.error}
                    onSetSelect={studyData.setSelectedSetId}
                    onNewSet={studyData.openNewSetModal}
                    onEditSet={studyData.openEditSetModal}
                  />

                  {/* Flashcard Display */}
                  <FlashcardDisplay
                    selectedSet={studyData.selectedSet}
                    onAddCard={studyData.openAddCardModal}
                    onDeleteCard={studyData.handleDeleteCard}
                  />
                </div>
              </section>

              {/* Statistics Section */}
              <StatisticsSection
                timeFilter={statistics.timeFilter}
                stats={statistics.stats}
                statsLoading={statistics.statsLoading}
                onTimeFilterChange={statistics.setTimeFilter}
                forceRefresh={statistics.forceRefresh}
                isAuthenticated={statistics.isAuthenticated}
              />

              {/* Testing Section - Development Only */}
              {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
                <TestingSection
                  showTesting={showTesting}
                  setShowTesting={setShowTesting}
                  timeFilter={statistics.timeFilter}
                  setStats={statistics.setStats}
                  setStatsLoading={statistics.setStatsLoading}
                />
              )}

              {/* Modals */}
              <StudyModals
                modalOpen={studyData.modalOpen}
                setModalOpen={studyData.setModalOpen}
                newSetName={studyData.newSetName}
                setNewSetName={studyData.setNewSetName}
                newCard={studyData.newCard}
                setNewCard={studyData.setNewCard}
                editingSetId={studyData.editingSetId}
                setEditingSetId={studyData.setEditingSetId}
                onAddSet={studyData.handleAddSet}
                onEditSet={studyData.handleEditSet}
                onDeleteSet={studyData.handleDeleteSet}
                onAddCard={studyData.handleAddCard}
              />
            </div>
          </div>
        </SkeletonDemo>

        {/* Backend Debugger - Development Only */}
        {process.env.NEXT_PUBLIC_APP_ENV === 'development' && <BackendDebugger />}
      </PageTransition>
    </AuthGuard>
  );
}