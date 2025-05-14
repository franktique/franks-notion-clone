/**
 * Utility functions for managing localStorage
 */

/**
 * Clear all application data from localStorage
 */
export function clearAppStorage(): void {
  if (typeof window === 'undefined') return;
  
  // Remove the main app storage
  localStorage.removeItem('notion-clone-storage');
  
  console.log('Application storage cleared successfully');
}

/**
 * Reset the application state to initial values
 */
export function resetAppState(): void {
  if (typeof window === 'undefined') return;
  
  // Clear existing storage
  clearAppStorage();
  
  // Initialize with empty state
  localStorage.setItem('notion-clone-storage', JSON.stringify({
    state: {
      notes: [],
      activeNoteId: null
    },
    version: 0
  }));
  
  console.log('Application state reset to initial values');
  
  // Force page reload to reflect the changes
  window.location.reload();
}
