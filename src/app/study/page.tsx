// src/app/study/page.tsx
import React from 'react';
import Pomodoro from '@/components/Pomodoro';

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Pomodoro Timer Section */}
        <section className="mb-12">
          <Pomodoro />
        </section>

        {/* Study Techniques Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spaced Repetition Card */}
            <div className="bg-white shadow rounded p-6">
              <div className="flex items-center mb-4">
                {/* Insert your desired icon here */}
                <span className="mr-2 text-blue-500">[Icon]</span>
                <h3 className="text-xl font-semibold">Spaced Repetition</h3>
              </div>
              <p className="text-gray-600 mb-2">Next Review: In 2 days</p>
              <div className="w-full bg-gray-200 rounded h-2">
                <div className="bg-blue-500 h-2 rounded" style={{ width: '80%' }}></div>
              </div>
            </div>
            {/* Active Recall Card */}
            <div className="bg-white shadow rounded p-6">
              <div className="flex items-center mb-4">
                {/* Insert your desired icon here */}
                <span className="mr-2 text-blue-500">[Icon]</span>
                <h3 className="text-xl font-semibold">Active Recall</h3>
              </div>
              <p className="text-gray-600 mb-2">8/10 completed</p>
              <div className="w-full bg-gray-200 rounded h-2">
                <div className="bg-blue-500 h-2 rounded" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Cards Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded p-4 text-center">
              <h4 className="text-lg font-bold">Focus Time</h4>
              <p className="text-gray-600">4h 30m</p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
              <h4 className="text-lg font-bold">Sessions</h4>
              <p className="text-gray-600">12</p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
              <h4 className="text-lg font-bold">Streak</h4>
              <p className="text-gray-600">5 days</p>
            </div>
            <div className="bg-white shadow rounded p-4 text-center">
              <h4 className="text-lg font-bold">Tasks Done</h4>
              <p className="text-gray-600">24</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
