import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Input,
  Button,
  HStack,
  VStack,
  Image,
  Icon,
  IconButton,
  Heading,
  Badge,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Checkbox,
  Stack,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiSliders, 
  FiMap,
  FiHeart,
  FiWifi,
  FiMonitor,
  FiCoffee,
  FiMapPin,
  FiChevronLeft,
} from 'react-icons/fi';
import { MdPool } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { BRAND_PRIMARY } from '../constants/colors';

const SearchPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [favorites, setFavorites] = useState([]);
  const [priceRange, setPriceRange] = useState([200, 2000]);

  const searchResults = [
    {
      id: 1,
      name: 'Căn hộ cao cấp view biển tuyệt đẹp',
      location: 'Sơn Trà, Đà Nẵng',
      price: '850.000',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 128,
      amenities: ['Wifi', 'Pool', 'AC', 'Kitchen'],
      beds: 2,
      baths: 2,
    },
    {
      id: 2,
      name: 'Villa sang trọng giữa núi rừng',
      location: 'Trung tâm, Đà Lạt',
      price: '1.200.000',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      rating: 4.8,
      reviews: 95,
      amenities: ['Wifi', 'Pool', 'Garden', 'Fireplace'],
      beds: 3,
      baths: 2,
    },
    {
      id: 3,
      name: 'Homestay ấm cúng phong cách Nhật Bản',
      location: 'Tây Hồ, Hà Nội',
      price: '500.000',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
      rating: 4.7,
      reviews: 203,
      amenities: ['Wifi', 'Kitchen', 'Workspace'],
      beds: 1,
      baths: 1,
    },
    {
      id: 4,
      name: 'Căn hộ Studio hiện đại ngay trung tâm',
      location: 'Quận 1, Hồ Chí Minh',
      price: '650.000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 156,
      amenities: ['Wifi', 'AC', 'Gym', 'Parking'],
      beds: 1,
      baths: 1,
    },
    {
      id: 5,
      name: 'Penthouse view toàn cảnh thành phố',
      location: 'Hai Bà Trưng, Hà Nội',
      price: '1.500.000',
      image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=400&fit=crop',
      rating: 5.0,
      reviews: 87,
      amenities: ['Wifi', 'Pool', 'Gym', 'Balcony'],
      beds: 3,
      baths: 3,
    },
    {
      id: 6,
      name: 'Nhà gỗ ven hồ yên bình',
      location: 'Ba Vì, Hà Nội',
      price: '700.000',
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=600&h=400&fit=crop',
      rating: 4.6,
      reviews: 74,
      amenities: ['Wifi', 'BBQ', 'Lake View', 'Garden'],
      beds: 2,
      baths: 1,
    },
  ];

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const amenityIcons = {
    'Wifi': FiWifi,
    'Pool': MdPool,
    'AC': FiMonitor,
    'Kitchen': FiCoffee,
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header with Search */}
      <Box 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        position="sticky" 
        top={0} 
        zIndex={10}
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={4}>
          <VStack spacing={3} align="stretch">
            <Flex align="center" gap={3}>
              <IconButton
                icon={<FiChevronLeft />}
                onClick={() => navigate('/')}
                variant="ghost"
                aria-label="Back"
              />
              <Box flex={1} position="relative">
                <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </Box>
                <Input
                  placeholder="Đà Nẵng"
                  pl="40px"
                  bg="gray.50"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="10px"
                />
              </Box>
            </Flex>

            {/* Filter Bar */}
            <Flex gap={2} overflowX="auto" pb={2}>
              <Button
                leftIcon={<FiSliders />}
                variant="outline"
                size="sm"
                borderRadius="full"
                onClick={onOpen}
                borderColor="gray.300"
              >
                Lọc
              </Button>
              <Button
                leftIcon={<FiMap />}
                variant="outline"
                size="sm"
                borderRadius="full"
                borderColor="gray.300"
              >
                Bản đồ
              </Button>
              <Badge 
                px={3} 
                py={2} 
                borderRadius="full" 
                bg="gray.100"
                fontSize="xs"
                cursor="pointer"
              >
                Ngày: 15-20 Jan
              </Badge>
              <Badge 
                px={3} 
                py={2} 
                borderRadius="full" 
                bg="gray.100"
                fontSize="xs"
                cursor="pointer"
              >
                2 Người
              </Badge>
            </Flex>
          </VStack>
        </Container>
      </Box>

      {/* Results */}
      <Container maxW="container.xl" py={6}>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Tìm thấy {searchResults.length} chỗ ở tại Đà Nẵng
        </Text>

        <VStack spacing={4} align="stretch">
          {searchResults.map((room) => (
            <Box
              key={room.id}
              cursor="pointer"
              onClick={() => navigate(`/room/${room.id}`)}
              transition="all 0.2s"
              bg="white"
              borderRadius="12px"
              overflow="hidden"
              boxShadow="sm"
              _hover={{ 
                boxShadow: 'lg',
                transform: 'translateY(-2px)'
              }}
            >
              <Flex direction={{ base: 'column', md: 'row' }}>
                <Box position="relative" w={{ base: '100%', md: '300px' }} h="200px">
                  <Image
                    src={room.image}
                    alt={room.name}
                    w="100%"
                    h="100%"
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

                <Box flex={1} p={4}>
                  <Flex direction="column" h="100%" justify="space-between">
                    <VStack align="start" spacing={2}>
                      <Heading size="md" fontWeight="700" noOfLines={1}>
                        {room.name}
                      </Heading>
                      
                      <Flex align="center" gap={1}>
                        <Icon as={FiMapPin} boxSize={4} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          {room.location}
                        </Text>
                      </Flex>

                      <Flex align="center" gap={3} flexWrap="wrap">
                        <Flex align="center" gap={1}>
                          <Text fontSize="lg">⭐</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {room.rating}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            ({room.reviews} đánh giá)
                          </Text>
                        </Flex>
                      </Flex>

                      <HStack spacing={2} color="gray.600">
                        <Text fontSize="sm">🛏️ {room.beds} Giường</Text>
                        <Text>•</Text>
                        <Text fontSize="sm">🚿 {room.baths} WC</Text>
                      </HStack>
                    </VStack>

                    <Flex justify="space-between" align="center" mt={3}>
                      <HStack spacing={2}>
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} bg="gray.100" color="gray.700" fontSize="xs">
                            {amenity}
                          </Badge>
                        ))}
                      </HStack>
                      
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="700" color={BRAND_PRIMARY} fontSize="xl">
                          {room.price}₫
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          /đêm
                        </Text>
                      </VStack>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Container>

      {/* Filter Drawer */}
      <Drawer 
        isOpen={isOpen} 
        placement="right" 
        onClose={onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Bộ lọc tìm kiếm</DrawerHeader>

          <DrawerBody>
            <VStack spacing={6} align="stretch" py={4}>
              {/* Price Range */}
              <Box>
                <Text fontWeight="600" mb={3}>
                  Khoảng giá (nghìn đồng/đêm)
                </Text>
                <Flex justify="space-between" align="center" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Từ</Text>
                    <Input 
                      type="number" 
                      value={priceRange[0]} 
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      size="sm"
                      w="100px"
                    />
                  </Box>
                  <Text color="gray.500">-</Text>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Đến</Text>
                    <Input 
                      type="number" 
                      value={priceRange[1]} 
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                      size="sm"
                      w="100px"
                    />
                  </Box>
                </Flex>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {priceRange[0]}k - {priceRange[1]}k VNĐ/đêm
                </Text>
              </Box>

              {/* Room Type */}
              <Box>
                <Text fontWeight="600" mb={3}>
                  Loại phòng
                </Text>
                <Stack spacing={2}>
                  <Checkbox>Homestay</Checkbox>
                  <Checkbox>Căn hộ</Checkbox>
                  <Checkbox>Villa</Checkbox>
                  <Checkbox>Glamping</Checkbox>
                </Stack>
              </Box>

              {/* Amenities */}
              <Box>
                <Text fontWeight="600" mb={3}>
                  Tiện ích
                </Text>
                <Stack spacing={2}>
                  <Checkbox>Wifi miễn phí</Checkbox>
                  <Checkbox>Bể bơi</Checkbox>
                  <Checkbox>Điều hòa</Checkbox>
                  <Checkbox>Bếp</Checkbox>
                  <Checkbox>Bãi đỗ xe</Checkbox>
                  <Checkbox>Thú cưng được phép</Checkbox>
                </Stack>
              </Box>

              {/* Buttons */}
              <Flex gap={3}>
                <Button variant="ghost" flex={1} onClick={onClose}>
                  Đặt lại
                </Button>
                <Button colorScheme="blue" flex={1} onClick={onClose}>
                  Áp dụng
                </Button>
              </Flex>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default SearchPage;