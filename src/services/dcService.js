/**
 * Distribution Center Service
 * Manages the current selected distribution center and persists it in localStorage
 */

const DC_STORAGE_KEY = 'selected_dc_code';

/**
 * Get the currently selected DC code from localStorage
 * @returns {string|null} The selected DC code or null if not set
 */
export const getSelectedDC = () => {
  try {
    return localStorage.getItem(DC_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting selected DC:', error);
    return null;
  }
};

/**
 * Set the currently selected DC code in localStorage
 * @param {string} dcCode - The DC code to set as selected
 */
export const setSelectedDC = (dcCode) => {
  try {
    localStorage.setItem(DC_STORAGE_KEY, dcCode);
    window.dispatchEvent(new CustomEvent('cossim-dc-changed', { detail: { dcCode } }));
  } catch (error) {
    console.error('Error setting selected DC:', error);
  }
};

/**
 * Clear the selected DC from localStorage
 */
export const clearSelectedDC = () => {
  try {
    localStorage.removeItem(DC_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cossim-dc-changed', { detail: { dcCode: '' } }));
  } catch (error) {
    console.error('Error clearing selected DC:', error);
  }
};

/**
 * Get the default DC code from user data
 * @param {Object} user - The user object
 * @returns {string|null} The default DC code or null if not found
 */
export const getDefaultDCFromUser = (user) => {
  if (!user?.AssignedDistributionCenter?.length) {
    return null;
  }

  // If user has only one DC, return it
  if (user.AssignedDistributionCenter.length === 1) {
    return user.AssignedDistributionCenter[0].DCCode;
  }

  // If user has multiple DCs, check if there's a current selection
  const currentSelection = getSelectedDC();
  if (currentSelection) {
    // Verify the selected DC is still assigned to the user
    const isValidSelection = user.AssignedDistributionCenter.some(dc => dc.DCCode === currentSelection);
    if (isValidSelection) {
      return currentSelection;
    }
  }

  // Return the first DC as default
  return user.AssignedDistributionCenter[0].DCCode;
};

/**
 * Get all assigned DCs for a user
 * @param {Object} user - The user object
 * @returns {Array} Array of assigned DC objects
 */
export const getAssignedDCs = (user) => {
  return user?.AssignedDistributionCenter || [];
};

/**
 * Restrict an API-provided DC list to the centres assigned to the signed-in user.
 * Assigned records are used as a fallback when the global list has no matching row.
 */
export const filterDistributionCentersToAssigned = (user, distributionCenters = []) => {
  const assigned = Array.isArray(user?.AssignedDistributionCenter) ? user.AssignedDistributionCenter : [];
  const assignedByCode = new Map(assigned.map((dc) => [String(dc?.DCCode ?? dc?.dcCode ?? "").trim(), dc]).filter(([code]) => code));
  if (!assignedByCode.size) return [];
  const globalByCode = new Map((Array.isArray(distributionCenters) ? distributionCenters : [])
    .map((dc) => [String(dc?.DCCode ?? dc?.dcCode ?? "").trim(), dc]).filter(([code]) => code));
  return [...assignedByCode.entries()].map(([code, assignedDC]) => ({ ...(globalByCode.get(code) || {}), ...assignedDC, DCCode: code }));
};

/**
 * Get DC details by code
 * @param {Object} user - The user object
 * @param {string} dcCode - The DC code to find
 * @returns {Object|null} The DC object or null if not found
 */
export const getDCByCode = (user, dcCode) => {
  if (!user?.AssignedDistributionCenter?.length || !dcCode) {
    return null;
  }

  return user.AssignedDistributionCenter.find(dc => dc.DCCode === dcCode) || null;
};
