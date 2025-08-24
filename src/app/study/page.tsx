"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import PageTransition from '@/components/PageTransition';
import { StudyPageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Priority 1: Critical above-the-fold components (immediate load)
import Pomodoro from "@/components/pomodoro";

// Secondary components without per-component loaders
const QuickNotes = dynamic(() => import("@/components/QuickNotes"), { ssr: false });

const StudySetsPanel = dynamic(() => import('./components/StudySetsPanel'), { ssr: false });

const FlashcardDisplay = dynamic(() => import('./components/FlashcardDisplay'), { ssr: false });

const StatisticsSection = dynamic(() => import('./components/StatisticsSection'), { ssr: false });

const StudyModals = dynamic(() => import('./components/StudyModals'), { ssr: false });

// Import the custom hooks
import { useStudyData } from './hooks/useStudyData';
import { useStatistics } from './hooks/useStatistics';

export default function StudyPage() {
  // Remove staged reveals; render all together after skeleton delay
  
  // Use custom hooks for data management
  const studyData = useStudyData();
  const statistics = useStatistics();

  useEffect(() => {}, []);

  return (
    <AuthGuard>
      <PageTransition>
        <SkeletonDemo skeleton={<StudyPageSkeleton />} enabled={false}>
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
              />

              {/* Statistics Dev Tools - Development Only */}

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
      </PageTransition>
    </AuthGuard>
  );
}