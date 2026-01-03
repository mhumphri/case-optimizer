/**
 * Geocode a postcode to coordinates using Google Maps Geocoding API
 */
export const geocodePostcode = async (postcode: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const geocoder = new google.maps.Geocoder();
    
    const result = await geocoder.geocode({
      address: postcode + ', London, UK',
      region: 'UK',
    });

    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      return {
        latitude: location.lat(),
        longitude: location.lng(),
      };
    }
    
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