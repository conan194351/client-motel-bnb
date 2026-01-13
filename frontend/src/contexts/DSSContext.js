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
  const [preferences, setPreferences] = useState({
    price_sensitivity: 0.5,      // 0-1: Quan tâm giá (0=không quan tâm, 1=rất quan tâm)
    comfort_priority: 0.5,        // 0-1: Tiện nghi
    distance_tolerance: 0.5,      // 0-1: Vị trí (0=xa được, 1=phải gần)
    view_importance: 0.5,         // 0-1: View đẹp
    cleanliness_priority: 0.5,    // 0-1: Vệ sinh
  });

  // Required amenities (Hard Constraints)
  const [requiredAmenities, setRequiredAmenities] = useState([]);

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

  // Toggle amenity
  const toggleAmenity = useCallback((amenity) => {
    setRequiredAmenities(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity);
      }
      return [...prev, amenity];
    });
  }, []);

  // Helper: Get location string
  const getLocationString = (room) => {
    // Try to extract city/area from name or use coordinates
    if (room.name) {
      // Simple heuristic: look for Vietnamese location names
      const locationMatch = room.name.match(/(Đà Nẵng|Hà Nội|Đà Lạt|Sài Gòn|Nha Trang|Hội An|Huế|Phú Quốc)/i);
      if (locationMatch) {
        return locationMatch[1];
      }
    }
    return 'Việt Nam';
  };

  // Helper: Calculate distance (simplified - assumes central point)
  const calculateDistance = (lat, lon) => {
    if (!lat || !lon) return 5.0;
    // Simplified: random distance for demo
    return Math.random() * 10 + 1;
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
  }, []);

  // Fetch recommendations from backend
  const fetchRecommendations = useCallback(async () => {
    setDssResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Construct API payload matching backend format
      const payload = {
        preferences: {
          price_sensitivity: preferences.price_sensitivity,
          comfort_priority: preferences.comfort_priority,
          distance_tolerance: preferences.distance_tolerance,
          view_importance: preferences.view_importance,
          cleanliness_priority: preferences.cleanliness_priority,
        },
        filters: {
          min_price: null,
          max_price: null,
          min_rating: 4.0,  // Only show rooms with rating >= 4.0
          room_type: null,
          min_accommodates: searchParams.guests || 1,
          max_distance: 10.0,  // Within 10km if location provided
          latitude: searchParams.lat,
          longitude: searchParams.lng,
          instant_bookable: null,
          superhost_only: false,
        },
        limit: 20,
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
              min_rating: 4.0,
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
        
        // Use mock data as last resort
        const mockData = getMockRecommendations();
        setDssResults({
          ranked_rooms: mockData.ranked_rooms,
          ideal_best: mockData.ideal_best,
          ideal_worst: mockData.ideal_worst,
          loading: false,
          error: `⚠️ Đang dùng dữ liệu demo (${errorMessage})`,
        });

        return mockData;
      }
    }
  }, [searchParams, preferences, requiredAmenities, transformRoomData]);

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

  // Reset all preferences to default
  const resetPreferences = useCallback(() => {
    setPreferences({
      price_sensitivity: 0.5,
      comfort_priority: 0.5,
      distance_tolerance: 0.5,
      view_importance: 0.5,
      cleanliness_priority: 0.5,
    });
  }, []);

  const value = {
    searchParams,
    updateSearchParams,
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    requiredAmenities,
    toggleAmenity,
    dssResults,
    fetchRecommendations,
    selectedForCompare,
    toggleRoomForCompare,
    clearCompareSelection,
  };

  return <DSSContext.Provider value={value}>{children}</DSSContext.Provider>;
};

// Mock data for development/testing
function getMockRecommendations() {
  return {
    ranked_rooms: [
      {
        id: 1,
        name: 'Homestay Nhà Gỗ View Đồi Thông',
        price: 350000,
        rating: 4.8,
        reviews: 128,
        reviewCount: 128,
        image: 'https://images.unsplash.com/photo-1502672260066-6bc176f4cd69?w=400',
        location: 'Đà Lạt, Lâm Đồng',
        distance: 5.2,
        topsis_score: 0.92,
        explanation: 'Giá cực tốt và View đồi thông đẹp',
        normalized_values: {
          price: 0.95,
          comfort: 0.75,
          distance: 0.60,
          view: 0.90,
          cleanliness: 0.85,
        },
      },
      {
        id: 2,
        name: 'Villa Sunset View Cao Cấp',
        price: 800000,
        rating: 4.9,
        reviews: 89,
        reviewCount: 89,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        location: 'Đà Lạt, Lâm Đồng',
        distance: 2.1,
        topsis_score: 0.78,
        explanation: 'Tiện nghi cao cấp, gần trung tâm',
        normalized_values: {
          price: 0.45,
          comfort: 0.95,
          distance: 0.95,
          view: 0.88,
          cleanliness: 0.92,
        },
      },
      {
        id: 3,
        name: 'Khách sạn Central Plaza',
        price: 650000,
        rating: 4.5,
        reviews: 234,
        reviewCount: 234,
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        location: 'Đà Lạt, Lâm Đồng',
        distance: 0.8,
        topsis_score: 0.65,
        explanation: 'Vị trí đắc địa nhưng giá cao',
        normalized_values: {
          price: 0.60,
          comfort: 0.70,
          distance: 0.98,
          view: 0.55,
          cleanliness: 0.80,
        },
      },
    ],
    ideal_best: {
      price: 1.0,
      comfort: 1.0,
      distance: 1.0,
      view: 1.0,
      cleanliness: 1.0,
    },
    ideal_worst: {
      price: 0.0,
      comfort: 0.0,
      distance: 0.0,
      view: 0.0,
      cleanliness: 0.0,
    },
  };
}
