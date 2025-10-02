/**
 * Utility functions for generating unique identifiers
 */

/**
 * Generates a unique ID using crypto.randomUUID if available,
 * otherwise falls back to a timestamp-based approach
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a short ID for UI purposes
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * Generates a prefixed ID
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateId()}`;
}
