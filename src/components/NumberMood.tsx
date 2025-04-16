'use client';

import { useState } from 'react';
// Re-importing the styles module
import styles from '../app/track/page.module.css';

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

  // Removed Tailwind getRatingColor function

  return (
    // Reverted section and content to use styles.*
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Mood Tracking</h2>
      <div className={styles.moodGrid}>
        {/* Happiness Card */}
        <div className={styles.moodCard}>
          <h3 className={styles.moodTitle}>Happiness</h3>
          <p className={styles.moodDescription}>How happy do you feel today?</p>
          <input 
            type="range" 
            className={styles.rangeInput} 
            min="1" 
            max="5" 
            value={moodRatings.happiness}
            // Restoring original onChange logic if it manipulated DOM attributes
             onChange={(e) => {
               handleRatingChange('happiness', e.target.value);
               const ratingElement = e.target.nextElementSibling?.nextElementSibling;
               if (ratingElement) {
                 ratingElement.setAttribute('data-rating', e.target.value);
                 ratingElement.textContent = `${e.target.value}/5`;
               }
             }}
          />
          <div className={styles.scaleLabels}>
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          {/* Reverted rating div - relies on CSS module for color via data-rating */}
          <div className={styles.rating} data-rating={moodRatings.happiness}>
            {moodRatings.happiness}/5
          </div>
        </div>

        {/* Satisfaction Card */}
        <div className={styles.moodCard}>
          <h3 className={styles.moodTitle}>Satisfaction</h3>
          <p className={styles.moodDescription}>How satisfied are you with your day?</p>
          <input 
            type="range" 
            className={styles.rangeInput} 
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
          <div className={styles.scaleLabels}>
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div className={styles.rating} data-rating={moodRatings.satisfaction}>
            {moodRatings.satisfaction}/5
          </div>
        </div>

        {/* Stress Card */}
        <div className={styles.moodCard}>
          <h3 className={styles.moodTitle}>Stress</h3>
          <p className={styles.moodDescription}>How stressed do you feel today?</p>
          <input 
            type="range" 
            className={styles.rangeInput} 
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
          <div className={styles.scaleLabels}>
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          {/* Using moodRatingStress class for inverted colors */}
          <div className={`${styles.rating} ${styles.moodRatingStress}`} data-rating={moodRatings.stress}>
            {moodRatings.stress}/5
          </div>
        </div>
      </div>
    </section>
  );
} 