'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BreathworkExercises from '@/components/BreathworkExercises';
import GratitudeList from '@/components/GratitudeList';
import MantraInput from '@/components/MantraInput';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';

const themes = [
  {
    name: 'Stoicism',
    subtitle: 'Ancient wisdom for modern resilience',
  },
  {
    name: 'Flow',
    subtitle: 'The psychology of optimal experience',
  },
  {
    name: 'Kaizen',
    subtitle: 'Continuous improvement through small steps',
  },
  {
    name: 'Ikigai',
    subtitle: 'Finding your reason for being',
  },
];

export default function RelaxPage() {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [gratitudes, setGratitudes] = useState<string[]>(['', '', '']);
  const [mantra, setMantra] = useState('');
  const [pinnedMantra, setPinnedMantra] = useState('');

  const handleGratitudeChange = (index: number, text: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = text;
    setGratitudes(newGratitudes);
  };

  const handleSaveGratitudes = () => {
    // Here you would typically save to a database or local storage
    console.log('Saving gratitudes:', gratitudes);
  };

  const handleMantraChange = (text: string) => {
    setMantra(text);
  };

  const handleSaveMantra = () => {
    setPinnedMantra(mantra);
    // Here you would typically save to a database or local storage
    console.log('Saving mantra:', mantra);
  };

  const nextTheme = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % themes.length);
  };

  const prevTheme = () => {
    setCurrentThemeIndex((prev) => (prev - 1 + themes.length) % themes.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-12">
        {/* Quote of the Day */}
        <div className="w-full max-w-2xl mx-auto">
          <QuoteOfTheDay resetIntervalHours={24} />
        </div>

        {/* Pinned Mantra */}
        {pinnedMantra && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-primary/10 rounded-xl p-6 text-center">
              <p className="text-xl font-medium text-primary">{pinnedMantra}</p>
            </div>
          </div>
        )}

        {/* Weekly Theme Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">Weekly Theme</h2>
              <div className="flex gap-4">
                <button
                  onClick={prevTheme}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Previous theme"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600 hover:text-primary" />
                </button>
                <button
                  onClick={nextTheme}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Next theme"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600 hover:text-primary" />
                </button>
              </div>
            </div>

            {/* Theme Content */}
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4 text-primary">
                {themes[currentThemeIndex].name}
              </h3>
              <p className="text-gray-600">
                {themes[currentThemeIndex].subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Mantra Input Section */}
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Daily Mantra</h2>
          <MantraInput
            mantra={mantra}
            onChange={handleMantraChange}
            onSave={handleSaveMantra}
          />
        </div>

        {/* Gratitude List Section */}
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Daily Gratitude</h2>
          <GratitudeList
            entries={gratitudes}
            onChange={handleGratitudeChange}
            onSave={handleSaveGratitudes}
          />
        </div>

        {/* Breathing Exercises Section */}
        <div>
          <h1 className="text-3xl font-bold text-center mb-8">Breathing Exercises</h1>
          <BreathworkExercises />
        </div>
      </div>
    </div>
  );
}
