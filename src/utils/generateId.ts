/**
 * Generates a unique ID for use in components and state management
 * Uses a combination of timestamp and random alphanumeric characters
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}; 