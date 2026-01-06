/**
 * Normalize UK postcode format for comparison
 * Removes spaces and converts to uppercase
 */
const normalizePostcode = (postcode: string): string => {
  return postcode.replace(/\s+/g, '').toUpperCase();
};

/**
 * Check if the geocoded result matches the input postcode
 */
const isValidPostcodeMatch = (inputPostcode: string, geocodedAddress: string): boolean => {
  const normalizedInput = normalizePostcode(inputPostcode);
  const normalizedGeocoded = normalizePostcode(geocodedAddress);
  
  // Check if the geocoded address contains the input postcode
  // This handles cases where Google returns "SW1A 1AA, Westminster, London, UK"
  return normalizedGeocoded.includes(normalizedInput);
};

/**
 * Validate UK postcode format (basic check)
 */
const isValidUKPostcodeFormat = (postcode: string): boolean => {
  // UK postcode regex: https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
  const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.trim());
};

/**
 * Geocode a postcode to coordinates using Google Maps Geocoding API
 * Now with validation to prevent accepting gibberish
 */
export const geocodePostcode = async (postcode: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    // Step 1: Basic format validation
    if (!isValidUKPostcodeFormat(postcode)) {
      console.warn(`Invalid UK postcode format: ${postcode}`);
      return null;
    }

    const geocoder = new google.maps.Geocoder();
    
    // Step 2: Try geocoding with just the postcode first (without ", London, UK")
    let result = await geocoder.geocode({
      address: postcode,
      region: 'UK',
      componentRestrictions: {
        country: 'UK',
      },
    });

    // Step 3: Validate the result
    if (result.results && result.results.length > 0) {
      const firstResult = result.results[0];
      const location = firstResult.geometry.location;
      const geocodedAddress = firstResult.formatted_address;
      
      // Check if the geocoded address actually contains our postcode
      if (isValidPostcodeMatch(postcode, geocodedAddress)) {
        console.log(`✅ Successfully geocoded ${postcode} to ${geocodedAddress}`);
        return {
          latitude: location.lat(),
          longitude: location.lng(),
        };
      } else {
        // The geocoder returned something, but it doesn't match our postcode
        console.warn(`❌ Geocoded address "${geocodedAddress}" doesn't match input "${postcode}"`);
        return null;
      }
    }
    
    console.warn(`❌ No results found for postcode: ${postcode}`);
    return null;
  } catch (error) {
    console.error(`Failed to geocode ${postcode}:`, error);
    return null;
  }
};

/**
 * Geocode multiple postcodes in batches to avoid rate limits
 */
export const geocodePostcodes = async (
  postcodes: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, { latitude: number; longitude: number }>> => {
  const results = new Map<string, { latitude: number; longitude: number }>();
  const batchSize = 10; // Process 10 at a time
  const delayMs = 200; // Delay between batches to avoid rate limits

  for (let i = 0; i < postcodes.length; i += batchSize) {
    const batch = postcodes.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (postcode) => {
        const coords = await geocodePostcode(postcode);
        return { postcode, coords };
      })
    );

    // Store results
    batchResults.forEach(({ postcode, coords }) => {
      if (coords) {
        results.set(postcode, coords);
      }
    });

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, postcodes.length), postcodes.length);
    }

    // Delay before next batch (except for last batch)
    if (i + batchSize < postcodes.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
};