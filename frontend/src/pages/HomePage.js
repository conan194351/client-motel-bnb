import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  HStack,
  VStack,
  Image,
  Icon,
  IconButton,
  Heading,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { 
  FiMapPin, 
  FiHeart,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDSS } from '../contexts/DSSContext';
import LocationSearchInput from '../components/LocationSearchInput';
import { BRAND_PRIMARY, BRAND_HOVER } from '../constants/colors';

const HomePage = () => {
  const navigate = useNavigate();
  const { updateSearchParams, fetchRecommendations } = useDSS();
  const [favorites, setFavorites] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Load featured rooms on mount
  useEffect(() => {
    const loadFeaturedRooms = async () => {
      setLoadingFeatured(true);
      try {
        // Set default location to NYC
        updateSearchParams({
          location: 'New York, NY, USA',
          lat: 40.7128,
          lng: -74.0060,
          city: 'New York',
        });

        // Fetch recommendations (no filters, just limit)
        const response = await fetchRecommendations(8);

        if (response && response.ranked_results) {
          setFeaturedRooms(response.ranked_results.map(result => ({
            id: result.room.room_id,
            name: result.room.name,
            location: result.room.neighbourhood_cleansed || result.room.city || 'New York, NY',
            price: result.room.price?.toLocaleString('en-US') || '0',
            image: result.room.picture_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop',
            rating: result.room.review_scores_rating || 4.0,
            reviews: result.room.number_of_reviews || 0,
          })));
        }
      } catch (error) {
        console.error('Error loading featured rooms:', error);
        setFeaturedRooms([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    loadFeaturedRooms();
  }, []);

  const handleLocationSelect = (location) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    
    // Update search params in DSS context
    updateSearchParams({
      location: location.description,
      lat: location.lat,
      lng: location.lng,
      city: location.city || 'New York',
    });
    
    // Navigate to search page
    navigate('/search');
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <Box minH="100vh" bg="white">
      {/* Header */}
      <Box 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.100" 
        position="sticky" 
        top={0} 
        zIndex={10}
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="600" color="gray.800">
                Hello, Andrew! 👋
              </Text>
              <Flex align="center" gap={1} color="gray.600">
                <Icon as={FiMapPin} boxSize={4} />
                <Text fontSize="sm">New York, NY</Text>
              </Flex>
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={6}>
        {/* Floating Search Bar with Google Places */}
        <Box mb={8}>
          <VStack spacing={3} align="stretch">
            <LocationSearchInput
              onLocationSelect={handleLocationSelect}
              placeholder="Search locations in New York..."
              defaultValue={selectedLocation?.description}
            />
            
            {selectedLocation && (
              <Box
                p={3}
                bg="blue.50"
                borderRadius="10px"
                border="1px solid"
                borderColor="blue.200"
              >
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FiMapPin} color="blue.600" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="600" color="blue.800">
                        {selectedLocation.description}
                      </Text>
                      <Text fontSize="xs" color="blue.600">
                        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Button
                    size="sm"
                    bg={BRAND_PRIMARY}
                    color="white"
                    _hover={{ bg: BRAND_HOVER }}
                    onClick={() => navigate('/search')}
                  >
                    Search Rooms →
                  </Button>
                </Flex>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Featured Section */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontWeight="700">
              Recommended for you ✨
            </Heading>
            <Text fontSize="sm" color={BRAND_PRIMARY} fontWeight="600" cursor="pointer" onClick={() => navigate('/search')}>
              View all
            </Text>
          </Flex>

          {loadingFeatured ? (
            <Flex justify="center" align="center" minH="200px">
              <VStack spacing={3}>
                <Spinner size="lg" color={BRAND_PRIMARY} />
                <Text fontSize="sm" color="gray.600">Loading recommendations...</Text>
              </VStack>
            </Flex>
          ) : featuredRooms.length === 0 ? (
            <Flex justify="center" align="center" minH="200px">
              <VStack spacing={3}>
                <Text fontSize="sm" color="gray.600">No rooms available at the moment.</Text>
                <Button onClick={() => navigate('/search')} colorScheme="orange">
                  Try Search
                </Button>
              </VStack>
            </Flex>
          ) : (
            <HStack 
              spacing={4} 
              overflowX="auto" 
              pb={4}
              css={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#FF7A45',
                  borderRadius: '10px',
                },
              }}
            >
              {featuredRooms.map((room) => (
              <Box
                key={room.id}
                minW="280px"
                maxW="280px"
                cursor="pointer"
                onClick={() => navigate(`/room/${room.id}`)}
                transition="all 0.2s"
                borderRadius="12px"
                overflow="hidden"
                bg="white"
                boxShadow="sm"
                _hover={{ 
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl'
                }}
              >
                <Box position="relative">
                  <Image
                    src={room.image}
                    alt={room.name}
                    h="180px"
                    w="100%"
                    objectFit="cover"
                  />
                  <IconButton
                    icon={<FiHeart />}
                    position="absolute"
                    top={2}
                    right={2}
                    borderRadius="full"
                    size="sm"
                    bg="white"
                    color={favorites.includes(room.id) ? 'red.500' : 'gray.600'}
                    _hover={{ bg: 'white', transform: 'scale(1.1)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(room.id);
                    }}
                    aria-label="Add to favorites"
                  />
                </Box>
                <Box p={4}>
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="700" fontSize="md" noOfLines={1}>
                      {room.name}
                    </Text>
                    <Flex align="center" gap={1}>
                      <Icon as={FiMapPin} boxSize={3} color="gray.500" />
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {room.location}
                      </Text>
                    </Flex>
                    <Flex justify="space-between" w="100%" align="center">
                      <Flex align="center" gap={1}>
                        <Text fontSize="sm">⭐</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {room.rating}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ({room.reviews})
                        </Text>
                      </Flex>
                      <Text fontWeight="700" color={BRAND_PRIMARY} fontSize="md">
                        ${room.price}
                        <Text as="span" fontSize="xs" fontWeight="400" color="gray.600">
                          /night
                        </Text>
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
              </Box>
              ))}
            </HStack>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;

