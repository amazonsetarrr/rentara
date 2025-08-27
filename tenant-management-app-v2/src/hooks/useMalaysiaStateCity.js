import { useState, useEffect, useCallback } from 'react';
import malaysianData from '../data/malaysianStatesCities.json';

/**
 * @typedef {Object} StateData
 * @property {string} name - The name of the state
 * @property {string[]} cities - Array of city names in the state
 */

/**
 * @typedef {Object} UseMalaysiaStateCityReturn
 * @property {string[]} states - Array of state names
 * @property {string[]} cities - Array of city names for selected state
 * @property {string} selectedState - Currently selected state
 * @property {boolean} loadingStates - Whether states are loading
 * @property {boolean} loadingCities - Whether cities are loading
 * @property {string|null} error - Error message if any
 * @property {function} handleStateChange - Function to handle state selection
 */

// Helper to get local data with simulated async behavior for consistency
const getLocalData = async (type, stateName = null) => {
  // Simulate network delay for consistent UX, but skip in test environment
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  if (!isTestEnv) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    if (type === 'states') {
      return malaysianData.states.map(state => state.name);
    } else if (type === 'cities' && stateName) {
      const state = malaysianData.states.find(s => s.name === stateName);
      return state ? state.cities : [];
    }
    return [];
  } catch (error) {
    console.error(`Error getting local data for ${type}:`, error);
    throw new Error(`Failed to load ${type} data`);
  }
};

/**
 * Custom hook for managing Malaysian states and cities data
 * Provides local data with caching and proper loading states
 * @returns {UseMalaysiaStateCityReturn} Object containing states, cities, and handlers
 */
export const useMalaysiaStateCity = () => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState(null);

  // Load states on mount
  useEffect(() => {
    const getStates = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        // Try to get from cache first for performance
        const cachedStates = localStorage.getItem('malaysiaStates');
        if (cachedStates) {
          const parsedStates = JSON.parse(cachedStates);
          setStates(parsedStates);
          setLoadingStates(false);
          return;
        }

        // Get from local data and cache it
        const stateNames = await getLocalData('states');
        localStorage.setItem('malaysiaStates', JSON.stringify(stateNames));
        setStates(stateNames);
      } catch (e) {
        console.error('Error loading states:', e);
        setError('Failed to load states. Please refresh the page.');
        // Fallback to direct data access if local function fails
        try {
          const fallbackStates = malaysianData.states.map(state => state.name);
          setStates(fallbackStates);
          setError(null);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setLoadingStates(false);
      }
    };
    getStates();
  }, []);

  // Load cities when selectedState changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    const getCities = async () => {
      setLoadingCities(true);
      setError(null);
      try {
        // Try cache first
        const cacheKey = `malaysiaCities_${selectedState}`;
        const cachedCities = localStorage.getItem(cacheKey);
        if (cachedCities) {
          const parsedCities = JSON.parse(cachedCities);
          setCities(parsedCities);
          setLoadingCities(false);
          return;
        }

        // Get from local data and cache it
        const cityNames = await getLocalData('cities', selectedState);
        localStorage.setItem(cacheKey, JSON.stringify(cityNames));
        setCities(cityNames);
      } catch (e) {
        console.error('Error loading cities:', e);
        setError('Failed to load cities for the selected state.');
        // Fallback to direct data access
        try {
          const state = malaysianData.states.find(s => s.name === selectedState);
          const fallbackCities = state ? state.cities : [];
          setCities(fallbackCities);
          setError(null);
        } catch (fallbackError) {
          console.error('City fallback also failed:', fallbackError);
          setCities([]);
        }
      } finally {
        setLoadingCities(false);
      }
    };

    getCities();
  }, [selectedState]);

  /**
   * Handles state selection change
   * @param {string} state - The selected state name
   */
  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
    // Clear any previous errors when selecting a new state
    setError(null);
  }, []);

  /**
   * Clears the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedState('');
    setCities([]);
    setError(null);
  }, []);

  /**
   * Gets cities for a specific state without changing selection
   * @param {string} stateName - The state name to get cities for
   * @returns {Promise<string[]>} Array of city names
   */
  const getCitiesForState = useCallback(async (stateName) => {
    try {
      return await getLocalData('cities', stateName);
    } catch (error) {
      console.error('Error getting cities for state:', error);
      return [];
    }
  }, []);

  return {
    states,
    cities,
    selectedState,
    loadingStates,
    loadingCities,
    error,
    handleStateChange,
    clearSelection,
    getCitiesForState
  };
};
