import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'https://malaysia-states-api.herokuapp.com';

// Helper to fetch data from API with error handling
const fetchFromAPI = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export const useMalaysiaStateCity = () => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState(null);

  // Fetch states on mount
  useEffect(() => {
    const getStates = async () => {
      setLoadingStates(true);
      setError(null);
      try {
        // Try to get from cache first
        const cachedStates = localStorage.getItem('malaysiaStates');
        if (cachedStates) {
          setStates(JSON.parse(cachedStates));
        } else {
          const data = await fetchFromAPI('states');
          const stateNames = data.map(s => s.name);
          localStorage.setItem('malaysiaStates', JSON.stringify(stateNames));
          setStates(stateNames);
        }
      } catch (e) {
        setError('Failed to fetch states. Please try again later.');
      } finally {
        setLoadingStates(false);
      }
    };
    getStates();
  }, []);

  // Fetch cities when selectedState changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    const getCities = async () => {
      setLoadingCities(true);
      setError(null);
      try {
        const data = await fetchFromAPI(`states/${encodeURIComponent(selectedState)}`);
        const cityNames = data.map(c => c.name);
        setCities(cityNames);
      } catch (e) {
        setError('Failed to fetch cities for the selected state.');
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    getCities();
  }, [selectedState]);

  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
  }, []);

  return {
    states,
    cities,
    selectedState,
    loadingStates,
    loadingCities,
    error,
    handleStateChange
  };
};
