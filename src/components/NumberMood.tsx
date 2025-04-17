'use client';

import { useState } from 'react';

interface MoodRating {
  happiness: number;
  satisfaction: number;
  stress: number;
}

export default function NumberMood() {
  const [moodRatings, setMoodRatings] = useState<MoodRating>({
    happiness: 3,
    satisfaction: 3,
    stress: 3
  });

  const handleRatingChange = (type: keyof MoodRating, value: string) => {
    setMoodRatings(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  const getRatingColor = (rating: number, type: 'normal' | 'stress' = 'normal') => {
    if (type === 'stress') {
      switch (rating) {
        case 1: return 'bg-green-500';
        case 2: return 'bg-yellow-400';
        case 3: return 'bg-orange-500';
        case 4:
        case 5: return 'bg-red-500';
        default: return 'bg-green-500';
      }
    } else {
      switch (rating) {
        case 1:
        case 2: return 'bg-red-500';
        case 3: return 'bg-orange-500';
        case 4: return 'bg-yellow-400';
        case 5: return 'bg-green-500';
        default: return 'bg-yellow-400';
      }
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 mb-8 shadow-sm">
      <h2 className="text-2xl text-gray-800 mb-4">Mood Tracking</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Happiness</h3>
          <p className="text-gray-600 mb-4">How happy do you feel today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.happiness}
            onChange={(e) => {
              handleRatingChange('happiness', e.target.value);
              const ratingElement = e.target.nextElementSibling?.nextElementSibling;
              if (ratingElement) {
                ratingElement.setAttribute('data-rating', e.target.value);
                ratingElement.textContent = `${e.target.value}/5`;
              }
            }}
          />
          <div className="flex justify-between text-gray-600 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div className={`text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 ${getRatingColor(moodRatings.happiness)}`}>
            {moodRatings.happiness}/5
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Satisfaction</h3>
          <p className="text-gray-600 mb-4">How satisfied are you with your day?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.satisfaction}
            onChange={(e) => {
              handleRatingChange('satisfaction', e.target.value);
              const ratingElement = e.target.nextElementSibling?.nextElementSibling;
              if (ratingElement) {
                ratingElement.setAttribute('data-rating', e.target.value);
                ratingElement.textContent = `${e.target.value}/5`;
              }
            }}
          />
          <div className="flex justify-between text-gray-600 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div className={`text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 ${getRatingColor(moodRatings.satisfaction)}`}>
            {moodRatings.satisfaction}/5
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Stress</h3>
          <p className="text-gray-600 mb-4">How stressed do you feel today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.stress}
            onChange={(e) => {
              handleRatingChange('stress', e.target.value);
              const ratingElement = e.target.nextElementSibling?.nextElementSibling;
              if (ratingElement) {
                ratingElement.setAttribute('data-rating', e.target.value);
                ratingElement.textContent = `${e.target.value}/5`;
              }
            }}
          />
          <div className="flex justify-between text-gray-600 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div className={`text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 ${getRatingColor(moodRatings.stress, 'stress')}`}>
            {moodRatings.stress}/5
          </div>
        </div>
      </div>
    </section>
  );
} 