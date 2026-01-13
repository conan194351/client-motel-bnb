import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { 
  FiMapPin, 
  FiHeart,
  FiHome,
  FiKey,
} from 'react-icons/fi';
import { MdVilla, MdCabin } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useDSS } from '../contexts/DSSContext';
import LocationSearchInput from '../components/LocationSearchInput';
import { BRAND_PRIMARY, BRAND_HOVER, BRAND_LIGHT } from '../constants/colors';

const HomePage = () => {
  const navigate = useNavigate();
  const { updateSearchParams } = useDSS();
  const [favorites, setFavorites] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

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

  const categories = [
    { name: 'Homestay', icon: FiHome, color: BRAND_PRIMARY },
    { name: 'Căn hộ', icon: FiKey, color: '#9F7AEA' },
    { name: 'Villa', icon: MdVilla, color: '#38A169' },
    { name: 'Glamping', icon: MdCabin, color: '#DD6B20' },
  ];

  const featuredRooms = [
    {
      id: 1,
      name: 'Căn hộ view biển tuyệt đẹp',
      location: 'Đà Nẵng, Việt Nam',
      price: '850.000',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop',
      rating: 4.9,
      reviews: 128,
    },
    {
      id: 2,
      name: 'Villa sang trọng giữa núi rừng',
      location: 'Đà Lạt, Lâm Đồng',
      price: '1.200.000',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop',
      rating: 4.8,
      reviews: 95,
    },
    {
      id: 3,
      name: 'Homestay ấm cúng phong cách Nhật',
      location: 'Hà Nội, Việt Nam',
      price: '500.000',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=300&fit=crop',
      rating: 4.7,
      reviews: 203,
    },
    {
      id: 4,
      name: 'Căn hộ Studio hiện đại',
      location: 'Hồ Chí Minh, Việt Nam',
      price: '650.000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop',
      rating: 4.9,
      reviews: 156,
    },
  ];

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
                Xin chào, Andrew! 👋
              </Text>
              <Flex align="center" gap={1} color="gray.600">
                <Icon as={FiMapPin} boxSize={4} />
                <Text fontSize="sm">Hà Nội, Việt Nam</Text>
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
              placeholder="Tìm kiếm địa điểm ở New York..."
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
                    Tìm phòng →
                  </Button>
                </Flex>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Categories */}
        <Box mb={8}>
          <HStack spacing={4} overflowX="auto" pb={2}>
            {categories.map((category) => (
              <VStack
                key={category.name}
                minW="80px"
                p={3}
                bg="gray.50"
                borderRadius="12px"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ 
                  bg: BRAND_LIGHT, 
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
              >
                <Box
                  bg="white"
                  p={3}
                  borderRadius="full"
                  boxShadow="sm"
                >
                  <Icon as={category.icon} boxSize={6} color={category.color} />
                </Box>
                <Text fontSize="sm" fontWeight="500" textAlign="center">
                  {category.name}
                </Text>
              </VStack>
            ))}
          </HStack>
        </Box>

        {/* Featured Section */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontWeight="700">
              Đề xuất cho bạn ✨
            </Heading>
            <Text fontSize="sm" color={BRAND_PRIMARY} fontWeight="600" cursor="pointer">
              Xem tất cả
            </Text>
          </Flex>

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
                        {room.price}₫
                        <Text as="span" fontSize="xs" fontWeight="400" color="gray.600">
                          /đêm
                        </Text>
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
              </Box>
            ))}
          </HStack>
        </Box>

        {/* Popular Destinations Section */}
        <Box mt={12}>
          <Heading size="md" fontWeight="700" mb={4}>
            Địa điểm phổ biến 🔥
          </Heading>
          <HStack spacing={4} overflowX="auto" pb={4}>
            {['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Đà Lạt', 'Nha Trang'].map((city) => (
              <Box
                key={city}
                minW="140px"
                h="100px"
                borderRadius="12px"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)', boxShadow: 'lg' }}
              >
                <Text fontWeight="600" fontSize="md">
                  {city}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;

