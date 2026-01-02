export const formatDuration = (duration: string | { seconds: number } | any): string => {
  if (duration && typeof duration === 'object' && 'seconds' in duration) {
    const seconds = duration.seconds;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
  
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)s/);
    if (match) {
      const seconds = parseInt(match[1]);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${seconds}s`;
    }
    return duration;
  }
  
  return '0s';
};

export const formatTime = (timestamp: string | { seconds: number } | any): string => {
  try {
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString();
    }
    
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString();
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};