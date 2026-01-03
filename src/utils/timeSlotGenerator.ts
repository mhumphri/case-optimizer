import type { TimeSlot } from '../types/route';

/**
 * Generate a random time in HH:mm format with 15-minute increments between 9am-5pm
 */
const generateRandomTimeIncrements = (): string => {
  // Generate hours between 9-16 (9am-4:45pm to allow for 15-min window)
  const minHour = 9;
  const maxHour = 16; // Up to 4:45pm so end time can be 5pm
  const hours = minHour + Math.floor(Math.random() * (maxHour - minHour + 1));
  
  // Generate minutes in 15-minute increments (0, 15, 30, 45)
  const minutes = Math.floor(Math.random() * 4) * 15;
  
  // Make sure we don't go past 4:45pm
  if (hours === 16 && minutes === 45) {
    // If we hit 4:45pm, ensure end time won't exceed 5pm
    return '16:30'; // Return 4:30pm instead
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Generate a random delivery time slot (15-minute window) between 9am-5pm
 * Returns undefined for cases that don't need a slot (11 out of 12)
 */
export const generateDeliverySlot = (): TimeSlot | undefined => {
  // 1 in 12 cases should have a delivery slot
  if (Math.random() > 1/12) {
    return undefined;
  }
  
  // Generate a random start time between 9am-4:45pm
  const startTime = generateRandomTimeIncrements();
  
  // End time is 15 minutes after start time
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  let endMinutes = startMinutes + 15;
  let endHours = startHours;
  
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  
  return {
    startTime,
    endTime,
  };
};

/**
 * Generate array of time options in 15-minute increments between 9am-5pm
 */
export const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  
  for (let hours = 9; hours <= 17; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 15) {
      // Don't add times after 5:00pm
      if (hours === 17 && minutes > 0) {
        break;
      }
      
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      options.push(time);
    }
  }
  
  return options;
};

/**
 * Convert time string (HH:mm) to seconds since midnight
 */
export const timeStringToSeconds = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60;
};