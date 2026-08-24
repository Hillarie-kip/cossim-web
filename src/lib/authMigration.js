/**
 * Migration Utility for Authentication Storage
 * Helps migrate from old insecure storage to new secure storage
 */

import secureStorage from './secureStorage'

export const migrateAuthStorage = () => {
  try {
    // Check if old 'user' key exists
    const oldUserData = localStorage.getItem('user')
    if (oldUserData) {
      console.log('Migrating old authentication data to secure storage...')

      const userData = JSON.parse(oldUserData)

      // Migrate to new secure storage
      secureStorage.setAuthData(userData)

      // Update the localStorage key
      localStorage.setItem('cossim-user', oldUserData)

      // Remove old key
      localStorage.removeItem('user')

      console.log('Migration completed successfully')
      return true
    }

    return false // No migration needed
  } catch (error) {
    console.error('Error during auth storage migration:', error)
    return false
  }
}

/**
 * Clean up any remaining old storage keys
 */
export const cleanupOldStorage = () => {
  try {
    const keysToRemove = ['user', 'auth-token', 'user-token']

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`Cleaned up old storage key: ${key}`)
      }
    })

    return true
  } catch (error) {
    console.error('Error during storage cleanup:', error)
    return false
  }
}

/**
 * Initialize migration on app startup
 */
export const initializeAuthMigration = () => {
  // Run migration
  const migrated = migrateAuthStorage()

  // Clean up old keys
  cleanupOldStorage()

  if (migrated) {
    console.log('Authentication storage migration completed')
  }
}

const authMigrationService = {
  migrateAuthStorage,
  cleanupOldStorage,
  initializeAuthMigration
};

export default authMigrationService;
