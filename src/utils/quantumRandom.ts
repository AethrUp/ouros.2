/**
 * Quantum Random Number Generator
 *
 * Uses ANU Quantum Random Number Generator API for true random numbers
 * Falls back to cryptographically secure random when unavailable
 */

interface QuantumAPIResponse {
  success: boolean;
  data: number[];
}

/**
 * Get quantum random numbers from ANU QRNG API
 * Falls back to crypto.getRandomValues() if unavailable
 *
 * @param count - Number of random numbers needed
 * @returns Array of random uint8 numbers (0-255)
 */
export const getQuantumRandom = async (count: number): Promise<number[]> => {
  console.log(`🔮 Requesting ${count} quantum random numbers...`);

  try {
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_QUANTUM_API_KEY;

    // ANU Quantum Random Number Generator API
    // Paid tier with API key authentication
    // Returns uint8 array (0-255)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key to headers if available
    if (apiKey && apiKey !== 'your_quantum_api_key_here') {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(
      `https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`,
      {
        method: 'GET',
        headers,
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Quantum API returned status ${response.status}`);
    }

    const data: QuantumAPIResponse = await response.json();

    if (data.success && Array.isArray(data.data) && data.data.length === count) {
      console.log('✨ Using quantum random numbers from ANU QRNG:', data.data);
      return data.data;
    }

    throw new Error('Invalid quantum API response format');
  } catch (error) {
    console.warn('⚠️ Quantum API unavailable, using crypto fallback:', error);
    return getCryptoRandom(count);
  }
};

/**
 * Cryptographically secure fallback random number generator
 * Uses Web Crypto API when quantum API is unavailable
 *
 * @param count - Number of random numbers needed
 * @returns Array of random uint8 numbers (0-255)
 */
const getCryptoRandom = (count: number): number[] => {
  const array = new Uint8Array(count);

  // Use Web Crypto API if available (standard in modern environments)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    console.log('🔐 Using cryptographically secure random numbers');
  } else {
    // Final fallback (should rarely happen in React Native)
    console.warn('⚠️ Using Math.random fallback');
    for (let i = 0; i < count; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array);
};

/**
 * Pre-fetch quantum random numbers for offline use
 * Stores a pool of random numbers for when the API is unavailable
 *
 * @param poolSize - Number of random numbers to pre-fetch
 */
export const prefetchQuantumPool = async (poolSize: number = 1000): Promise<void> => {
  try {
    const randomNumbers = await getQuantumRandom(poolSize);
    // Store in AsyncStorage for offline use
    // This would be implemented with AsyncStorage in production
    console.log(`Pre-fetched ${randomNumbers.length} quantum random numbers`);
  } catch (error) {
    console.error('Failed to pre-fetch quantum pool:', error);
  }
};

/**
 * Test quantum random generator connectivity
 * Useful for diagnostics and settings
 */
export const testQuantumAPI = async (): Promise<{
  available: boolean;
  responseTime?: number;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_QUANTUM_API_KEY;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key to headers if available
    if (apiKey && apiKey !== 'your_quantum_api_key_here') {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(
      'https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8',
      {
        headers,
        signal: AbortSignal.timeout(3000)
      }
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        available: false,
        responseTime,
        error: `API returned status ${response.status}`
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        available: true,
        responseTime
      };
    }

    return {
      available: false,
      responseTime,
      error: 'Invalid API response'
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
