import { timeService } from '@/services/timeService';

/**
 * Formats a timestamp into a human-readable "time ago" string
 * @param isoString - The timestamp to format
 * @param currentDateTime - The current datetime for comparison (optional)
 */
export function getTimeAgo(isoString: string | undefined, currentDateTime?: string): string {
  if (!isoString) return "Never";
  
  // Use provided current datetime or get from time service
  let now: Date;
  if (currentDateTime) {
    now = new Date(currentDateTime);
  } else {
    const serviceState = timeService.getState();
    now = (serviceState.isReady && serviceState.currentTime) 
      ? new Date(serviceState.currentTime.user_current_datetime) 
      : new Date();
  }
    
  const saved = new Date(isoString);
  const diff = Math.floor((now.getTime() - saved.getTime()) / 1000);
  const minutes = Math.floor(diff / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats date for display in journal entries
 * @param isoString - The ISO date string to format
 */
export function formatEntryDate(isoString?: string): string {
  if (!isoString) return 'No date';
  
  // Use time service for consistent formatting if ready
  if (timeService.isReady()) {
    try {
      return timeService.formatUserDate(isoString, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      // Fall through to local formatting
    }
  }
  
  // Fallback to local formatting
  try {
    return new Date(isoString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Formats date for current entry creation
 * @param currentDate - The current date to format (required - no fallbacks)
 */
export function formatCurrentDate(currentDate: string): string {
  if (!currentDate || currentDate === 'LOADING_DATE' || currentDate === 'Loading...') {
    return "Loading...";
  }
  
  // Use time service for consistent formatting if ready
  if (timeService.isReady()) {
    return timeService.formatUserDate(currentDate, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Fallback to local formatting if time service not ready
  try {
    // Handle date-only strings properly to avoid timezone shifts
    if (currentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = currentDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      const date = new Date(currentDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Extracts preview text from entry content
 */
export function getPreviewText(content: string, maxLength: number = 100): string {
  if (!content) return 'No content preview available';
  
  const cleanText = content.replace(/<[^>]+>/g, '');
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Find the last space within or near the character limit
  const truncated = cleanText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) { // Only use space if it's not too far back
    return cleanText.substring(0, lastSpaceIndex) + '...';
  } else {
    // If no suitable space found, look a bit further
    const extended = cleanText.substring(0, maxLength * 1.2);
    const nextSpaceIndex = extended.indexOf(' ', maxLength);
    if (nextSpaceIndex !== -1 && nextSpaceIndex < maxLength * 1.2) {
      return cleanText.substring(0, nextSpaceIndex) + '...';
    } else {
      return truncated + '...';
    }
  }
}

/**
 * Writing prompts for inspiration
 */
export const WRITING_PROMPTS = [
  "What am I most grateful for today?",
  "What challenge did I overcome?",
  "How did I grow today?",
  "What brought me joy?",
  "What would I like to improve tomorrow?"
]; 