import { Platform } from 'react-native';

/**
 * Utility function to handle network requests with proper error handling
 * @param fetchFunction The async function that performs the network request
 * @param fallbackData Optional fallback data to return if the request fails
 * @returns A promise that resolves to the result of the fetch function or the fallback data
 */
export async function withErrorHandling<T>(
  fetchFunction: () => Promise<T>,
  fallbackData?: T
): Promise<{ data: T | undefined; error: string | null }> {
  try {
    // Check if the device is online
    if (Platform.OS !== 'web') {
      // For native platforms, we could use NetInfo here
      // For simplicity, we'll assume the device is online
    } else {
      // For web, check navigator.onLine
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { 
          data: fallbackData, 
          error: 'אין חיבור לאינטרנט. בדוק את החיבור שלך ונסה שוב.' 
        };
      }
    }

    // Attempt the fetch
    const data = await fetchFunction();
    return { data, error: null };
  } catch (error) {
    console.error('Network error:', error);
    
    // Determine error message based on error type
    let errorMessage = 'שגיאת רשת. נסה שוב מאוחר יותר.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'הבקשה נכשלה בשל זמן תגובה ארוך. נסה שוב מאוחר יותר.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'בקשת הרשת נכשלה. בדוק את החיבור לאינטרנט ונסה שוב.';
      }
    }
    
    return { data: fallbackData, error: errorMessage };
  }
}

/**
 * Simulates a network request with a specified delay and failure rate
 * @param data The data to return if the request succeeds
 * @param delayMs The delay in milliseconds before resolving/rejecting
 * @param failureRate The probability (0-1) that the request will fail
 * @returns A promise that resolves to the data or rejects with an error
 */
export function simulateNetworkRequest<T>(
  data: T,
  delayMs = 1000,
  failureRate = 0.2
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failureRate) {
        reject(new Error('Network request failed'));
      } else {
        resolve(data);
      }
    }, delayMs);
  });
}