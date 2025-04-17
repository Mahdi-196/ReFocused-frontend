'use client';

import { useState, useRef } from 'react';
import NumberMood from '../../components/NumberMood';

interface DayData {
  mood: {
    happiness: number;
    satisfaction: number;
    stress: number;
  };
  dayRating: number;
  habits: {
    name: string;
    completed: boolean;
  }[];
}

interface MockData {
  [key: string]: DayData;
}

// Mock historical data
const mockDayData: MockData = {
  '2025-04-05': {
    mood: {
      happiness: 4,
      satisfaction: 5,
      stress: 2
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-04-08': {
    mood: {
      happiness: 2,
      satisfaction: 2,
      stress: 4
    },
    dayRating: 3,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-04-12': {
    mood: {
      happiness: 5,
      satisfaction: 4,
      stress: 2
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  }
};

type TabType = 'Summary' | 'Mood' | 'Habits';

export default function TrackPage() {
  const [habits, setHabits] = useState([
    { name: 'Exercise', streak: 3 },
    { name: 'Meditate', streak: 5 },
    { name: 'Read', streak: 0 }
  ]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('Summary');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
      } else {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
      }
    }
    setTouchStart(null);
  };

  const handleAddHabit = () => {
    if (newHabit.trim()) {
      setHabits([...habits, { name: newHabit, streak: 0 }]);
      setNewHabit('');
    }
  };

  const getDayClass = (dateStr: string) => {
    if (!mockDayData[dateStr]) return '';
    const dayRating = mockDayData[dateStr].dayRating;
    if (dayRating >= 8) return 'bg-green-50 border-green-200';
    if (dayRating >= 6) return 'bg-blue-50 border-blue-200';
    if (dayRating >= 4) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-600';
    if (rating >= 7) return 'bg-green-500';
    if (rating >= 5) return 'bg-yellow-400';
    if (rating >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMoodBadgeColor = (rating: number, type: 'happiness' | 'satisfaction' | 'stress' = 'happiness') => {
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

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    days.push(
      <div key="weekdays" className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>
    );

    const firstDayOfWeek = firstDay.getDay();
    const previousMonth = new Date(firstDay);
    previousMonth.setDate(0);
    const daysInPreviousMonth = previousMonth.getDate();

    const dateRows = [];
    let currentRow = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = daysInPreviousMonth - firstDayOfWeek + i + 1;
      currentRow.push(
        <div key={`prev-${date}`} className="aspect-square flex items-center justify-center text-gray-400 bg-gray-50 rounded">
          {date}
        </div>
      );
    }

    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayClass = getDayClass(dateStr);
      
      currentRow.push(
        <div
          key={date}
          className={`aspect-square flex items-center justify-center cursor-pointer rounded border transition-all ${
            dayClass
          } ${
            selectedDate === dateStr ? 'bg-black text-white border-black' : ''
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          {date}
        </div>
      );

      if (currentRow.length === 7) {
        dateRows.push(
          <div key={`row-${dateRows.length}`} className="grid grid-cols-7 gap-2">
            {currentRow}
          </div>
        );
        currentRow = [];
      }
    }

    const remainingCells = 7 - currentRow.length;
    if (remainingCells < 7) {
      for (let i = 1; i <= remainingCells; i++) {
        currentRow.push(
          <div key={`next-${i}`} className="aspect-square flex items-center justify-center text-gray-400 bg-gray-50 rounded">
            {i}
          </div>
        );
      }
      dateRows.push(
        <div key={`row-${dateRows.length}`} className="grid grid-cols-7 gap-2">
          {currentRow}
        </div>
      );
    }

    return (
      <div className="p-6">
        {days}
        {dateRows}
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDate || !mockDayData[selectedDate]) {
      return <p className="text-center text-gray-500 py-8">No tracking data for this date</p>;
    }

    const data = mockDayData[selectedDate];
    const date = new Date(selectedDate);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const renderTabContent = () => {
      switch (activeTab) {
        case 'Summary':
          return (
            <div className="flex flex-col gap-6">
              <div>
                <div className="font-medium text-gray-800 mb-2">Day Rating:</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-white font-medium ${getRatingColor(data.dayRating)}`}>
                  {data.dayRating}/10
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-800 mb-3">Mood:</div>
                <div className="flex flex-col gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.happiness)}`}>
                    Happy: {data.mood.happiness}/5
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.satisfaction)}`}>
                    Satisfied: {data.mood.satisfaction}/5
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.stress, 'stress')}`}>
                    Stress: {data.mood.stress}/5
                  </span>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-800 mb-2">Habits:</div>
                <div className="text-gray-700">
                  {data.habits.filter(h => h.completed).length}/{data.habits.length} completed
                </div>
              </div>
            </div>
          );
        
        case 'Mood':
          return (
            <div className="space-y-6">
              <div>
                <div className="font-medium text-gray-800 mb-2">Happiness</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-blue-500 transition-all duration-300`}
                      style={{ width: `${(data.mood.happiness / 5) * 100}%` }}
                    />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.happiness)}`}>
                    {data.mood.happiness}/5
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-800 mb-2">Satisfaction</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-green-500 transition-all duration-300`}
                      style={{ width: `${(data.mood.satisfaction / 5) * 100}%` }}
                    />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.satisfaction)}`}>
                    {data.mood.satisfaction}/5
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-800 mb-2">Stress</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-red-500 transition-all duration-300`}
                      style={{ width: `${(data.mood.stress / 5) * 100}%` }}
                    />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-white font-medium ${getMoodBadgeColor(data.mood.stress, 'stress')}`}>
                    {data.mood.stress}/5
                  </div>
                </div>
              </div>
            </div>
          );

        case 'Habits':
          return (
            <div className="space-y-3">
              {data.habits.map((habit, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-800">{habit.name}</span>
                  <span className={`px-3 py-1 rounded-full text-white font-medium ${
                    habit.completed ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {habit.completed ? 'Completed' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          );
      }
    };

    return (
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-xl font-medium text-gray-800 mb-6">{formattedDate}</h3>
        
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
          {(['Summary', 'Mood', 'Habits'] as TabType[]).map((tab) => (
            <div
              key={tab}
              className={`flex-1 text-center py-2 rounded cursor-pointer transition-colors ${
                activeTab === tab ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-600'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="text-gray-700">
          {renderTabContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tracking Dashboard</h1>
        <p className="text-gray-600">Monitor your mood, habits, and daily progress</p>
      </header>

      {/* Habit Tracking Section */}
      <section className="bg-white rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl text-gray-800 mb-4">Habit Tracking</h2>
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Habit Tracker</h3>
          <p className="text-gray-600 mb-4">Track your daily habits and build streaks</p>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a new habit..."
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
            />
            <button 
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              onClick={handleAddHabit}
            >
              Add
            </button>
          </div>

          <div className="space-y-3">
            {habits.map((habit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    id={`habit-${index}`} 
                  />
                  <label htmlFor={`habit-${index}`} className="text-gray-800">{habit.name}</label>
                </div>
                <span className="text-gray-600">{habit.streak} days</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mood Tracking Section */}
      <NumberMood />

      {/* Rate Your Day Section */}
      <section className="bg-white rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl text-gray-800 mb-4">Rate Your Day</h2>
        <div className="max-w-xl mx-auto">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Rate Your Day</h3>
          <p className="text-gray-600 mb-4">How would you rate your overall day on a scale of 1-10?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="10" 
            defaultValue="5" 
            onChange={(e) => {
              const rating = e.target.value;
              const ratingElement = e.target.nextElementSibling?.nextElementSibling;
              if (ratingElement) {
                ratingElement.setAttribute('data-rating', rating);
                ratingElement.textContent = `${rating}/10`;
              }
            }}
          />
          <div className="flex justify-between text-gray-600 mt-2">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
          <div className={`text-center py-2 rounded mt-4 text-white font-medium ${getRatingColor(5)}`}>
            5/10
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="bg-white rounded-xl mb-8 shadow-sm overflow-hidden">
        <h2 className="text-2xl text-gray-800 p-6">Calendar Overview</h2>
        <div 
          className="select-none"
          ref={calendarRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              ←
            </button>
            <h3 className="text-xl font-medium text-gray-800">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              →
            </button>
          </div>
          {renderCalendar()}
          {renderDayDetails()}
        </div>
      </section>
    </div>
  );
}
