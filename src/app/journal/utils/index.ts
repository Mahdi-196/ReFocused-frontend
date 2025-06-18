/**
 * Formats a timestamp into a human-readable "time ago" string
 */
export function getTimeAgo(isoString: string | undefined): string {
  if (!isoString) return "Never";
  const now = new Date();
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
 */
export function formatEntryDate(isoString?: string): string {
  if (!isoString) return 'No date';
  return new Date(isoString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Formats date for current entry creation
 */
export function formatCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
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