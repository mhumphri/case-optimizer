// London geographical bounds
const LONDON_BOUNDS = {
  minLat: 51.28,
  maxLat: 51.69,
  minLng: -0.51,
  maxLng: 0.33,
};

// Sample London postcode prefixes for realistic generation
const LONDON_POSTCODE_PREFIXES = [
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10',
  'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18',
  'EC1', 'EC2', 'EC3', 'EC4',
  'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10',
  'N11', 'N12', 'N13', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20',
  'NW1', 'NW2', 'NW3', 'NW4', 'NW5', 'NW6', 'NW7', 'NW8', 'NW9', 'NW10', 'NW11',
  'SE1', 'SE2', 'SE3', 'SE4', 'SE5', 'SE6', 'SE7', 'SE8', 'SE9', 'SE10',
  'SE11', 'SE12', 'SE13', 'SE14', 'SE15', 'SE16', 'SE17', 'SE18', 'SE19', 'SE20',
  'SW1', 'SW2', 'SW3', 'SW4', 'SW5', 'SW6', 'SW7', 'SW8', 'SW9', 'SW10',
  'SW11', 'SW12', 'SW13', 'SW14', 'SW15', 'SW16', 'SW17', 'SW18', 'SW19', 'SW20',
  'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10',
  'W11', 'W12', 'W13', 'W14',
  'WC1', 'WC2',
];

export interface LocationWithPostcode {
  latitude: number;
  longitude: number;
  postcode: string;
}

/**
 * Generate a random coordinate within London bounds
 */
export const generateRandomLondonCoordinate = (): { latitude: number; longitude: number } => {
  const latitude = LONDON_BOUNDS.minLat + Math.random() * (LONDON_BOUNDS.maxLat - LONDON_BOUNDS.minLat);
  const longitude = LONDON_BOUNDS.minLng + Math.random() * (LONDON_BOUNDS.maxLng - LONDON_BOUNDS.minLng);
  
  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
};

/**
 * Generate a random London postcode
 */
export const generateRandomLondonPostcode = (): string => {
  const prefix = LONDON_POSTCODE_PREFIXES[Math.floor(Math.random() * LONDON_POSTCODE_PREFIXES.length)];
  const number = Math.floor(Math.random() * 9) + 1;
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  return `${prefix} ${number}${letters}`;
};

/**
 * Generate a random London location with postcode
 */
export const generateRandomLondonLocation = (): LocationWithPostcode => {
  const coords = generateRandomLondonCoordinate();
  const postcode = generateRandomLondonPostcode();
  
  return {
    ...coords,
    postcode,
  };
};

/**
 * Generate multiple random London locations
 */
export const generateMultipleLocations = (count: number): LocationWithPostcode[] => {
  return Array.from({ length: count }, () => generateRandomLondonLocation());
};

/**
 * Convert time string (e.g., "09:00") to seconds since midnight
 */
export const timeToSeconds = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60;
};

/**
 * Get time window for 9am-5pm shift
 */
export const getShiftTimeWindow = () => {
  return {
    startTime: { seconds: timeToSeconds('09:00') },
    endTime: { seconds: timeToSeconds('17:00') },
  };
};

/**
 * Get lunch break constraint (45 minutes)
 */
export const getLunchBreakConstraint = () => {
  return {
    startTime: { seconds: timeToSeconds('12:00') },
    duration: { seconds: 45 * 60 }, // 45 minutes
  };
};