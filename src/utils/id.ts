/**
 * Generates a unique ID with an optional prefix
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
};

/**
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
  // @ts-ignore - Using crypto API which is available in all modern browsers
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}; 