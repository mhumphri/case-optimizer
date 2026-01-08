// utils/timeSlotGenerator.ts
import type { TimeSlot } from '../types/route';

/**
 * Generate a random time in HH:mm format with 15-minute increments
 * Constrained to 10:30-12:15 for delivery slots (to allow 15-min window ending at 12:30)
 */
const generateRandomDeliveryTime = (): string => {
  // Possible start times: 10:30, 10:45, 11:00, 11:15, 11:30, 11:45, 12:00, 12:15
  const possibleTimes = [
    '10:30', '10:45', 
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15'
  ];
  
  // Randomly select one of the possible times
  const randomIndex = Math.floor(Math.random() * possibleTimes.length);
  return possibleTimes[randomIndex];
};

/**
 * Generate a random delivery time slot (15-minute window) between 10:30am-12:30pm
 * Returns undefined for cases that don't need a slot (4 out of 5)
 */
export const generateDeliverySlot = (): TimeSlot | undefined => {
  // 1 in 5 cases should have a delivery slot
  if (Math.random() > 1/5) {
    return undefined;
  }
  
  // Generate a random start time between 10:30-12:15
  const startTime = generateRandomDeliveryTime();
  
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
 * Generate array of time options in 15-minute increments
 * @param extended - If true, range is 7am-8pm. If false, range is 9am-5pm
 */
export const generateTimeOptions = (extended: boolean = false): string[] => {
  const options: string[] = [];
  
  const startHour = extended ? 7 : 9;
  const endHour = extended ? 20 : 17;
  
  for (let hours = startHour; hours <= endHour; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 15) {
      // Don't add times after end hour
      if (hours === endHour && minutes > 0) {
        break;
      }
      
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      options.push(time);
    }
  }
  
  return options;
};

/**
 * Generate lunch duration options from 0 to 120 minutes in 15-minute increments
 */
export const generateLunchOptions = (): Array<{ value: number; label: string }> => {
  const options: Array<{ value: number; label: string }> = [];
  
  for (let minutes = 0; minutes <= 120; minutes += 15) {
    let label: string;
    
    if (minutes === 0) {
      label = 'No lunch break';
    } else if (minutes === 60) {
      label = '1 hour';
    } else if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        label = `${hours} hours`;
      } else {
        label = `${hours}h ${remainingMinutes}min`;
      }
    } else {
      label = `${minutes} min`;
    }
    
    options.push({ value: minutes, label });
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