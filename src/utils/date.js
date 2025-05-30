/**
 * Format a timestamp or block height into a human-readable date string
 * @param {number} timestamp - Unix timestamp or block height
 * @param {boolean} isBlockHeight - Whether the timestamp is a block height
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, isBlockHeight = false) => {
  // If it's a block height, we'll estimate the time based on average block time
  // Stacks has approximately 10-minute block times
  const date = isBlockHeight 
    ? new Date(Date.now() - (timestamp * 10 * 60 * 1000)) // Rough estimate
    : new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Get current date for comparison
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  // Format relative time for recent dates
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }
  
  // Format absolute date for older dates
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString(undefined, options);
};