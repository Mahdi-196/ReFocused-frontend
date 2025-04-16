'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';
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
    if (dayRating >= 8) return styles.greatDay;
    if (dayRating >= 6) return styles.goodDay;
    if (dayRating >= 4) return styles.averageDay;
    return styles.toughDay;
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    days.push(
      <div key="weekdays" className={styles.weekDays}>
        {weekDays.map(day => (
          <div key={day} className={styles.weekDay}>{day}</div>
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
        <div key={`prev-${date}`} className={`${styles.calendarDay} ${styles.otherMonth}`}>
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
          className={`${styles.calendarDay} ${dayClass} ${selectedDate === dateStr ? styles.selected : ''}`}
          onClick={() => setSelectedDate(dateStr)}
        >
          {date}
        </div>
      );

      if (currentRow.length === 7) {
        dateRows.push(
          <div key={`row-${dateRows.length}`} className={styles.calendarRow}>
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
          <div key={`next-${i}`} className={`${styles.calendarDay} ${styles.otherMonth}`}>
            {i}
          </div>
        );
      }
      dateRows.push(
        <div key={`row-${dateRows.length}`} className={styles.calendarRow}>
          {currentRow}
        </div>
      );
    }

    return (
      <div className={styles.calendarGrid}>
        {days}
        {dateRows}
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDate || !mockDayData[selectedDate]) {
      return <p className={styles.noData}>No tracking data for this date</p>;
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
            <div className={styles.summarySection}>
              <div>
                <div className={styles.dayRatingLabel}>Day Rating:</div>
                <div className={styles.dayRatingBadge} data-rating={data.dayRating}>
                  {data.dayRating}/10
                </div>
              </div>

              <div className={styles.moodSection}>
                <div className={styles.moodLabel}>Mood:</div>
                <div className={styles.moodBadges}>
                  <span className={styles.moodBadgeHappy} data-rating={data.mood.happiness}>
                    Happy: {data.mood.happiness}/5
                  </span>
                  <span className={styles.moodBadgeSatisfied} data-rating={data.mood.satisfaction}>
                    Satisfied: {data.mood.satisfaction}/5
                  </span>
                  <span className={styles.moodBadgeStress} data-rating={data.mood.stress}>
                    Stress: {data.mood.stress}/5
                  </span>
                </div>
              </div>

              <div className={styles.habitsSection}>
                <div className={styles.habitsLabel}>Habits:</div>
                <div className={styles.habitsCount}>
                  {data.habits.filter(h => h.completed).length}/{data.habits.length} completed
                </div>
              </div>
            </div>
          );
        
        case 'Mood':
          return (
            <div>
              <div className={styles.moodItem}>
                <div className={styles.moodLabel}>Happiness</div>
                <div className={styles.moodProgressContainer}>
                  <div className={styles.moodProgress}>
                    <div 
                      className={`${styles.moodProgressBar} ${styles.moodProgressHappy}`}
                      style={{ width: `${(data.mood.happiness / 5) * 100}%` }}
                    />
                  </div>
                  <div className={styles.moodRating} data-rating={data.mood.happiness}>
                    {data.mood.happiness}/5
                  </div>
                </div>
              </div>

              <div className={styles.moodItem}>
                <div className={styles.moodLabel}>Satisfaction</div>
                <div className={styles.moodProgressContainer}>
                  <div className={styles.moodProgress}>
                    <div 
                      className={`${styles.moodProgressBar} ${styles.moodProgressSatisfied}`}
                      style={{ width: `${(data.mood.satisfaction / 5) * 100}%` }}
                    />
                  </div>
                  <div className={styles.moodRating} data-rating={data.mood.satisfaction}>
                    {data.mood.satisfaction}/5
                  </div>
                </div>
              </div>

              <div className={styles.moodItem}>
                <div className={styles.moodLabel}>Stress</div>
                <div className={styles.moodProgressContainer}>
                  <div className={styles.moodProgress}>
                    <div 
                      className={`${styles.moodProgressBar} ${styles.moodProgressStress}`}
                      style={{ width: `${(data.mood.stress / 5) * 100}%` }}
                    />
                  </div>
                  <div className={`${styles.moodRating} ${styles.moodRatingStress}`} data-rating={data.mood.stress}>
                    {data.mood.stress}/5
                  </div>
                </div>
              </div>
            </div>
          );

        case 'Habits':
          return (
            <div>
              {data.habits.map((habit, index) => (
                <div key={index} className={styles.habitItem}>
                  <span className={styles.habitName}>{habit.name}</span>
                  <span className={`${styles.habitStatus} ${habit.completed ? styles.completed : styles.missed}`}>
                    {habit.completed ? 'Completed' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          );
      }
    };

    return (
      <div className={styles.dayDetails}>
        <h3 className={styles.selectedDate}>{formattedDate}</h3>
        
        <div className={styles.dayDetailsTabs}>
          {(['Summary', 'Mood', 'Habits'] as TabType[]).map((tab) => (
            <div
              key={tab}
              className={activeTab === tab ? styles.tabActive : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className={styles.dayDetailsContent}>
          {renderTabContent()}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Tracking Dashboard</h1>
        <p className={styles.headerDescription}>Monitor your mood, habits, and daily progress</p>
      </header>

      {/* Habit Tracking Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Habit Tracking</h2>
        <div className={styles.habitTracker}>
          <h3 className={styles.sectionTitle}>Habit Tracker</h3>
          <p className={styles.headerDescription}>Track your daily habits and build streaks</p>
          
          <div className={styles.addHabit}>
            <input
              type="text"
              className={styles.habitInput}
              placeholder="Add a new habit..."
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
            />
            <button className={styles.addButton} onClick={handleAddHabit}>Add</button>
          </div>

          <div className={styles.habitList}>
            {habits.map((habit, index) => (
              <div key={index} className={styles.habitItem}>
                <input type="checkbox" className={styles.habitCheckbox} id={`habit-${index}`} />
                <label htmlFor={`habit-${index}`}>{habit.name}</label>
                <span className={styles.streak}>{habit.streak} days</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mood Tracking Section - Now using the NumberMood component */}
      <NumberMood />

      {/* Rate Your Day Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rate Your Day</h2>
        <div className={styles.rateDay}>
          <h3 className={styles.moodTitle}>Rate Your Day</h3>
          <p className={styles.moodDescription}>How would you rate your overall day on a scale of 1-10?</p>
          <input 
            type="range" 
            className={styles.rangeInput} 
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
          <div className={styles.scaleLabels}>
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
          <div className={styles.rating} data-rating="5">5/10</div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calendar Overview</h2>
        <div 
          className={styles.calendarContainer}
          ref={calendarRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.calendarHeader}>
            <button 
              className={styles.calendarNav}
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              ←
            </button>
            <h3 className={styles.calendarTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              className={styles.calendarNav}
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
