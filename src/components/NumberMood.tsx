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

  const getRatingStyle = (rating: number, type: 'normal' | 'stress' = 'normal') => {
    if (type === 'stress') {
      switch (rating) {
        case 1: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 2: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 3: 
          return {
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 4:
        case 5: 
          return {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        default: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
      }
    } else {
      switch (rating) {
        case 1:
        case 2: 
          return {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 3: 
          return {
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 4: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 5: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        default: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
      }
    }
  };

  return (
    <div 
      className="rounded-lg p-6 shadow-md"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <h2 className="text-2xl text-white mb-4">Mood Tracking</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Happiness</h3>
          <p className="text-gray-300 mb-4">How happy do you feel today?</p>
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
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.happiness)}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.happiness}/5</span>
          </div>
        </div>

        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Satisfaction</h3>
          <p className="text-gray-300 mb-4">How satisfied are you with your day?</p>
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
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.satisfaction)}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.satisfaction}/5</span>
          </div>
        </div>

        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Stress</h3>
          <p className="text-gray-300 mb-4">How stressed do you feel today?</p>
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
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.stress, 'stress')}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.stress}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
} 