import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

// Configure API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DSSContext = createContext();

export const useDSS = () => {
  const context = useContext(DSSContext);
  if (!context) {
    throw new Error('useDSS must be used within a DSSProvider');
  }
  return context;
};

export const DSSProvider = ({ children }) => {
  // Search parameters (Hard Filters)
  const [searchParams, setSearchParams] = useState({
    location: '',
    city: 'New York', // Default to New York
    lat: 40.7128, // NYC default
    lng: -74.0060,
    checkIn: null,
    checkOut: null,
    guests: 2,
  });

  // User preferences for TOPSIS (Soft Filters - Weights)
  // Scale 1-10 for user input, converted to 0-1 for API
  const [preferences, setPreferences] = useState({
    price_sensitivity: 5,         // 1-10: Quan tâm giá (1=thấp, 10=cao)
    comfort_priority: 5,          // 1-10: Tiện nghi
    distance_tolerance: 5,        // 1-10: Vị trí
    view_importance: 5,           // 1-10: View đẹp
    cleanliness_priority: 5,      // 1-10: Vệ sinh
  });


  // DSS Results from TOPSIS
  const [dssResults, setDssResults] = useState({
    ranked_rooms: [],
    ideal_best: null,
    ideal_worst: null,
    loading: false,
    error: null,
  });

  // Selected rooms for comparison
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  // Update search params
  const updateSearchParams = useCallback((params) => {
    setSearchParams(prev => ({ ...prev, ...params }));
  }, []);

  // Update single preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update all preferences at once
  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);


  // Helper: Get location string
  const getLocationString = (room) => {
    // Try to extract city/area from name or use coordinates
    if (room.name) {
      // Simple heuristic: look for Vietnamese location names
      const locationMatch = room.name.match(/(New York|NYC|Manhattan|Brooklyn|Queens|Staten Island|Long Island)/i);
      if (locationMatch) {
        return locationMatch[1];
      }
    }
    return 'United States';
  };

  // Helper: Calculate distance using Haversine formula
  const calculateDistance = (roomLat, roomLng) => {
    if (!roomLat || !roomLng || !searchParams.lat || !searchParams.lng) return null;
    
    const R = 6371; // Radius of Earth in kilometers
    
    const toRad = (deg) => (deg * Math.PI) / 180;
    
    const dLat = toRad(roomLat - searchParams.lat);
    const dLng = toRad(roomLng - searchParams.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(searchParams.lat)) * Math.cos(toRad(roomLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2)); // Return distance in km, rounded to 2 decimals
  };

  // Helper: Generate mock normalized values if not provided
  const generateMockNormalizedValues = () => ({
    price: Math.random() * 0.5 + 0.5,
    comfort: Math.random() * 0.3 + 0.7,
    distance: Math.random() * 0.4 + 0.4,
    view: Math.random() * 0.5 + 0.4,
    cleanliness: Math.random() * 0.3 + 0.6,
  });

  // Transform backend response to frontend format
  const transformRoomData = useCallback((backendRoom) => {
    const room = backendRoom.room || backendRoom;
    
    return {
      id: room.room_id,
      name: room.name,
      price: room.price,
      rating: room.review_scores_rating || 4.5,
      reviews: room.number_of_reviews || 0,
      reviewCount: room.number_of_reviews || 0,
      image: room.picture_url || 'https://via.placeholder.com/400x300?text=No+Image',
      location: getLocationString(room),
      distance: calculateDistance(room.latitude, room.longitude),
      topsis_score: backendRoom.topsis_score || 0.75,
      explanation: backendRoom.explanation || 'Good match',
      normalized_values: backendRoom.normalized_values || generateMockNormalizedValues(),
      // Additional room details
      room_type: room.room_type,
      accommodates: room.accommodates,
      bedrooms: room.bedrooms,
      bathrooms: room.bathrooms,
      listing_url: room.listing_url,
      host_name: room.host_name,
      host_is_superhost: room.host_is_superhost,
    };
  }, [searchParams.lat, searchParams.lng]); // Add searchParams dependencies for calculateDistance

  // Fetch recommendations from backend
  const fetchRecommendations = useCallback(async (customLimit = null) => {
    setDssResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Construct API payload matching backend format
      // Convert 1-10 scale to 0.1-1.0 by dividing by 10
      // No filters - only user location and preferences
      const payload = {
        user_location: {
          latitude: searchParams.lat,
          longitude: searchParams.lng,
        },
        preferences: {
          price_sensitivity: preferences.price_sensitivity / 10,
          comfort_priority: preferences.comfort_priority / 10,
          distance_tolerance: preferences.distance_tolerance / 10,
          view_importance: preferences.view_importance / 10,
          cleanliness_priority: preferences.cleanliness_priority / 10,
        },
        limit: customLimit || 20,
      };

      console.log('Calling DSS API with payload:', payload);

      // Call backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/dss/recommend`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('DSS API Response:', response.data);

      // Transform backend response to frontend format
      const rankedRooms = response.data.ranked_results?.map(transformRoomData) || [];

      setDssResults({
        ranked_rooms: rankedRooms,
        ideal_best: response.data.ideal_best || null,
        ideal_worst: response.data.ideal_worst || null,
        computed_weights: response.data.computed_weights || {},
        loading: false,
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Không thể kết nối đến server';

      // Try fallback to simple search
      try {
        console.log('Falling back to simple search...');
        const fallbackResponse = await axios.get(
          `${API_BASE_URL}/api/v1/rooms`,
          {
            params: {
              limit: 20,
            },
            timeout: 5000,
          }
        );

        const rooms = fallbackResponse.data.rooms?.map((room, index) => 
          transformRoomData({
            ...room,
            room_id: room.room_id,
            topsis_score: 0.75 - (index * 0.02), // Decreasing scores
            explanation: `Rated ${room.review_scores_rating?.toFixed(1) || '4.5'}/5`,
            normalized_values: generateMockNormalizedValues(),
          })
        ) || [];

        setDssResults({
          ranked_rooms: rooms,
          ideal_best: null,
          ideal_worst: null,
          loading: false,
          error: null,
        });

        return { ranked_results: rooms };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        setDssResults({
          ranked_rooms: [],
          ideal_best: null,
          ideal_worst: null,
          loading: false,
          error: `Unable to connect to server: ${errorMessage}`,
        });

        return { ranked_results: [] };
      }
    }
  }, [searchParams, preferences, transformRoomData]);

  // Toggle room selection for comparison
  const toggleRoomForCompare = useCallback((room) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(r => r.id === room.id);
      if (exists) {
        return prev.filter(r => r.id !== room.id);
      }
      // Limit to 3 rooms for comparison
      if (prev.length >= 3) {
        return [...prev.slice(1), room];
      }
      return [...prev, room];
    });
  }, []);

  // Clear comparison selection
  const clearCompareSelection = useCallback(() => {
    setSelectedForCompare([]);
  }, []);

  // Reset all preferences to default (5 on 1-10 scale)
  const resetPreferences = useCallback(() => {
    setPreferences({
      price_sensitivity: 5,
      comfort_priority: 5,
      distance_tolerance: 5,
      view_importance: 5,
      cleanliness_priority: 5,
    });
  }, []);

  const value = {
    searchParams,
    updateSearchParams,
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    dssResults,
    fetchRecommendations,
    selectedForCompare,
    toggleRoomForCompare,
    clearCompareSelection,
  };

  return <DSSContext.Provider value={value}>{children}</DSSContext.Provider>;
};
