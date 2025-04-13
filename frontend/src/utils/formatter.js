/**
 * Format seconds to a readable time string (mm:ss)
 */
export const formatTimeMinSec = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  /**
   * Format seconds to a readable time string with milliseconds (mm:ss.ms)
   */
  export const formatTimePrecise = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  /**
   * Format a date object to a readable string (YYYY-MM-DD)
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Format a problem number for display
   */
  export const formatProblemNumber = (num) => {
    if (!num) return '';
    
    // Convert to string if it's a number
    const strNum = String(num);
    
    // If it's already in the format like "1A", return as is
    if (/^\d+[A-Za-z]$/.test(strNum)) {
      return strNum;
    }
    
    // Otherwise just return the number
    return strNum;
  };
  
  /**
   * Format a score as a percentage
   */
  export const formatScoreAsPercentage = (score, total) => {
    if (!total) return '0%';
    
    const percentage = (score / total) * 100;
    return `${Math.round(percentage)}%`;
  };
  
  /**
   * Create a display name for a contest (e.g., "AMC 10A 2022")
   */
  export const formatContestName = (contest, year) => {
    if (!contest) return '';
    
    if (year) {
      return `${contest} ${year}`;
    }
    
    return contest;
  };