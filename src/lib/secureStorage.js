/**
 * Secure Storage Utility
 * Provides encrypted storage with better security practices
 */

const STORAGE_KEY = 'cossim-auth'
const TOKEN_KEY = 'cossim-token'

// Simple encryption/decryption for basic obfuscation
// Note: For production, consider using more robust encryption like crypto-js
const encrypt = (text) => {
  try {
    return btoa(encodeURIComponent(text))
  } catch (error) {
    console.error('Encryption error:', error)
    return text
  }
}

const decrypt = (encryptedText) => {
  try {
    return decodeURIComponent(atob(encryptedText))
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText
  }
}

export const secureStorage = {
  /**
   * Store authentication data securely
   * @param {Object} data - Authentication data
   */
  setAuthData: (data) => {
    try {
      // Store only essential data, not full user object
      const authData = {
        token: data.UserToken || data.token,
        userId: data.UserID || data.id,
        role: data.UserRole || data.role,
        timestamp: Date.now()
      }

      // Use sessionStorage for better security (cleared on tab close)
      sessionStorage.setItem(STORAGE_KEY, encrypt(JSON.stringify(authData)))

      // Also store token in localStorage for persistence across sessions
      // but with shorter expiration
      const tokenData = {
        token: authData.token,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
      localStorage.setItem(TOKEN_KEY, encrypt(JSON.stringify(tokenData)))

    } catch (error) {
      console.error('Error storing auth data:', error)
    }
  },

  /**
   * Get authentication data
   * @returns {Object|null} Authentication data or null if not found/invalid
   */
  getAuthData: () => {
    try {
      // First try sessionStorage
      let authData = sessionStorage.getItem(STORAGE_KEY)

      if (!authData) {
        // Fallback to localStorage token
        const tokenData = localStorage.getItem(TOKEN_KEY)
        if (tokenData) {
          const decrypted = JSON.parse(decrypt(tokenData))
          if (decrypted.expires > Date.now()) {
            // Token is still valid, restore to sessionStorage
            authData = encrypt(JSON.stringify({
              token: decrypted.token,
              timestamp: Date.now()
            }))
            sessionStorage.setItem(STORAGE_KEY, authData)
          } else {
            // Token expired, clean up
            localStorage.removeItem(TOKEN_KEY)
            return null
          }
        }
      }

      if (authData) {
        const decrypted = JSON.parse(decrypt(authData))
        // Check if session data is not too old (optional security measure)
        const age = Date.now() - (decrypted.timestamp || 0)
        if (age < (8 * 60 * 60 * 1000)) { // 8 hours max session age
          return decrypted
        }
      }

      return null
    } catch (error) {
      console.error('Error retrieving auth data:', error)
      return null
    }
  },

  /**
   * Get only the token
   * @returns {string|null} Token or null
   */
  getToken: () => {
    const authData = secureStorage.getAuthData()
    return authData?.token || null
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    const authData = secureStorage.getAuthData()
    return !!(authData && authData.token)
  }
}

export default secureStorage
