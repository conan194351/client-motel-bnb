import React, { useState, useRef, useEffect } from 'react';
import { Input, Box, List, ListItem, Text, Icon, Spinner } from '@chakra-ui/react';
import { FiMapPin } from 'react-icons/fi';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

const LocationSearchInput = ({ onLocationSelect, onSelectAddress, placeholder = 'Where do you want to go?', initialValue = '' }) => {
  const [value, setValue] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimer = useRef(null);

  // Initialize with initialValue if provided
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Proximity to New York City to prioritize nearby results
      const proximity = '-74.006,40.7128'; // NYC coordinates
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `proximity=${proximity}&` +
        `limit=5&` +
        `types=place,locality,neighborhood,address,poi`
      );

      if (!response.ok) {
        throw new Error('Mapbox API error');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setShowSuggestions(true);

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelect = (suggestion) => {
    const { place_name, center, context } = suggestion;
    const [lng, lat] = center; // Mapbox returns [longitude, latitude]

    setValue(place_name);
    setSuggestions([]);
    setShowSuggestions(false);

    // Extract city from context if available
    let city = '';
    if (context) {
      const placeContext = context.find(c => c.id.includes('place'));
      if (placeContext) {
        city = placeContext.text;
      }
    }

    // Create location object
    const location = {
      description: place_name,
      lat: lat,
      lng: lng,
      city: city || place_name.split(',')[0],
    };

    // Call parent callback with location object (new format)
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    
    // Legacy support for old format
    if (onSelectAddress) {
      onSelectAddress(place_name, lat, lng);
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        mt={2}
        bg="white"
        borderRadius="10px"
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        zIndex={1000}
        maxH="300px"
        overflowY="auto"
      >
        <List spacing={0}>
          {suggestions.map((suggestion) => {
            const mainText = suggestion.text || '';
            const secondaryText = suggestion.place_name.replace(suggestion.text + ', ', '');

            return (
              <ListItem
                key={suggestion.id}
                px={4}
                py={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                borderBottom="1px solid"
                borderColor="gray.100"
                onClick={() => handleSelect(suggestion)}
              >
                <Box display="flex" alignItems="center">
                  <Icon as={FiMapPin} color="brand.500" mr={3} />
                  <Box>
                    <Text fontWeight="600" fontSize="14px">
                      {mainText}
                    </Text>
                    <Text fontSize="12px" color="gray.600">
                      {secondaryText}
                    </Text>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <Box position="relative" ref={wrapperRef} width="100%">
      <Box position="relative">
        <Icon
          as={FiMapPin}
          position="absolute"
          left="16px"
          top="50%"
          transform="translateY(-50%)"
          color="gray.400"
          zIndex={2}
          pointerEvents="none"
        />
        <Input
          value={value}
          onChange={handleInput}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          size="lg"
          pl="48px"
          pr="16px"
          borderRadius="10px"
          border="1px solid"
          borderColor="gray.300"
          _focus={{
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #FF7A45',
          }}
          _hover={{
            borderColor: 'gray.400',
          }}
          bg="white"
        />
        {loading && (
          <Box position="absolute" right="16px" top="50%" transform="translateY(-50%)">
            <Spinner size="sm" color="brand.500" />
          </Box>
        )}
      </Box>
      {renderSuggestions()}
    </Box>
  );
};

export default LocationSearchInput;
