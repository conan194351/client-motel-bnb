import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Icon,
  Heading,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  Checkbox,
  Tooltip,
  useDisclosure,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FiSliders, 
  FiHeart,
  FiMapPin,
  FiChevronLeft,
  FiBarChart2,
  FiCheckCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDSS } from '../contexts/DSSContext';
import SmartFilterModal from '../components/SmartFilterModal';
import CompareModal from '../components/CompareModal';
import LocationSearchInput from '../components/LocationSearchInput';
import { BRAND_PRIMARY } from '../constants/colors';

const SearchPage = () => {
  const navigate = useNavigate();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isCompareOpen, onOpen: onCompareOpen, onClose: onCompareClose } = useDisclosure();
  
  const {
    searchParams,
    updateSearchParams,
    dssResults,
    fetchRecommendations,
    selectedForCompare,
    toggleRoomForCompare,
    clearCompareSelection,
  } = useDSS();

  const [favorites, setFavorites] = useState([]);

  const handleLocationSelect = (location) => {
    updateSearchParams({
      location: location.description,
      lat: location.lat,
      lng: location.lng,
      city: location.city || 'New York',
    });
    // Auto trigger search
    fetchRecommendations();
  };

  // Fetch recommendations on mount (with mock data)
  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleCompareClick = () => {
    if (selectedForCompare.length > 0) {
      onCompareOpen();
    }
  };

  const RoomCard = ({ room }) => {
    const isFavorite = favorites.includes(room.id);
    const isSelected = selectedForCompare.find(r => r.id === room.id);
    const topsisPercent = Math.round(room.topsis_score * 100);

    // Get badge color based on score
    const getBadgeColor = () => {
      if (topsisPercent >= 85) return 'green';
      if (topsisPercent >= 70) return 'blue';
      if (topsisPercent >= 50) return 'yellow';
      return 'gray';
    };

    return (
      <Box
        bg="white"
        borderRadius="12px"
        overflow="hidden"
        boxShadow="sm"
        _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
        transition="all 0.3s"
        cursor="pointer"
        border="2px solid"
        borderColor={isSelected ? BRAND_PRIMARY : 'transparent'}
        position="relative"
      >
        {/* Image Section */}
        <Box position="relative" onClick={() => navigate(`/room/${room.id}`)}>
          <Image
            src={room.image}
            alt={room.name}
            w="100%"
            h="200px"
            objectFit="cover"
          />
          
          {/* Favorite Button */}
          <Button
            position="absolute"
            top={2}
            right={2}
            variant="ghost"
            size="sm"
            bg="white"
            borderRadius="full"
            boxShadow="md"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(room.id);
            }}
            _hover={{ bg: 'gray.100' }}
          >
            <Icon
              as={FiHeart}
              color={isFavorite ? 'red.500' : 'gray.600'}
              fill={isFavorite ? 'red.500' : 'none'}
            />
          </Button>

          {/* TOPSIS Score Badge */}
          <Box
            position="absolute"
            top={2}
            left={2}
            bg="white"
            borderRadius="12px"
            p={2}
            boxShadow="md"
          >
            <HStack spacing={2}>
              <CircularProgress
                value={topsisPercent}
                size="40px"
                color={getBadgeColor() + '.500'}
                trackColor="gray.200"
                thickness="8px"
              >
                <CircularProgressLabel fontSize="xs" fontWeight="700">
                  {topsisPercent}%
                </CircularProgressLabel>
              </CircularProgress>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" fontWeight="700" color="gray.700">
                  Smart Match
                </Text>
                <Badge colorScheme={getBadgeColor()} fontSize="2xs">
                  {topsisPercent >= 85 ? 'Xuất sắc' : topsisPercent >= 70 ? 'Tốt' : 'Phù hợp'}
                </Badge>
              </VStack>
            </HStack>
          </Box>
        </Box>

        {/* Content Section */}
        <Box p={4} onClick={() => navigate(`/room/${room.id}`)}>
          <VStack align="stretch" spacing={2}>
            {/* Name & Location */}
            <Heading size="sm" noOfLines={1}>
              {room.name}
            </Heading>
            <HStack spacing={1} color="gray.600">
              <Icon as={FiMapPin} w={3} h={3} />
              <Text fontSize="sm">{room.location}</Text>
            </HStack>

            {/* Explanation Badge */}
            {room.explanation && (
              <Badge
                colorScheme="purple"
                fontSize="xs"
                p={2}
                borderRadius="6px"
                textAlign="center"
              >
                💡 {room.explanation}
              </Badge>
            )}

            {/* Rating & Reviews */}
            <HStack spacing={2}>
              <Badge colorScheme="yellow" display="flex" alignItems="center" gap={1}>
                ⭐ {room.rating}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                ({room.reviews} đánh giá)
              </Text>
              {room.distance && (
                <>
                  <Text fontSize="xs" color="gray.400">•</Text>
                  <Text fontSize="xs" color="gray.600">
                    {room.distance} km
                  </Text>
                </>
              )}
            </HStack>

            {/* Price */}
            <HStack justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="gray.100">
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="700" color={BRAND_PRIMARY}>
                  {room.price?.toLocaleString('vi-VN')}₫
                </Text>
                <Text fontSize="xs" color="gray.500">
                  / đêm
                </Text>
              </VStack>
              
              {/* Compare Checkbox */}
              <Tooltip label="Thêm vào so sánh" placement="top">
                <Checkbox
                  isChecked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleRoomForCompare(room);
                  }}
                  colorScheme="orange"
                  size="lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Text fontSize="xs">So sánh</Text>
                </Checkbox>
              </Tooltip>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  };

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Header */}
      <Box bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
        <Container maxW="1200px" py={4}>
          <VStack spacing={4}>
            {/* Top Bar */}
            <Flex w="100%" justify="space-between" align="center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                leftIcon={<Icon as={FiChevronLeft} />}
              >
                Quay lại
              </Button>
              <Heading size="md" color="gray.700">
                Kết quả thông minh
              </Heading>
              <Box w="100px" /> {/* Spacer for centering */}
            </Flex>

            {/* Search Bar with Location */}
            <HStack w="100%" spacing={2}>
              {/* Show current location */}
              {searchParams.location && (
                <Badge colorScheme="blue" p={2} borderRadius="8px">
                  <Icon as={FiMapPin} mr={1} />
                  {searchParams.city || searchParams.location}
                </Badge>
              )}
              
              <LocationSearchInput
                onLocationSelect={handleLocationSelect}
                placeholder="Tìm địa điểm khác ở New York..."
                defaultValue={searchParams.location}
              />
              
              {/* Smart Filter Button */}
              <Tooltip label="Bộ lọc thông minh" placement="bottom">
                <Button
                  onClick={onFilterOpen}
                  bg={BRAND_PRIMARY}
                  color="white"
                  _hover={{ bg: 'brand.600' }}
                  leftIcon={<Icon as={FiSliders} />}
                >
                  Lọc thông minh
                </Button>
              </Tooltip>
            </HStack>

            {/* Compare Bar */}
            {selectedForCompare.length > 0 && (
              <Box
                w="100%"
                bg="blue.50"
                p={3}
                borderRadius="10px"
                border="1px solid"
                borderColor="blue.200"
              >
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FiBarChart2} color="blue.600" />
                    <Text fontSize="sm" fontWeight="600" color="blue.800">
                      Đã chọn {selectedForCompare.length} phòng để so sánh
                    </Text>
                  </HStack>
                  <HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={clearCompareSelection}
                    >
                      Xóa
                    </Button>
                    <Button
                      size="sm"
                      bg="blue.500"
                      color="white"
                      _hover={{ bg: 'blue.600' }}
                      onClick={handleCompareClick}
                      leftIcon={<Icon as={FiBarChart2} />}
                    >
                      So sánh ngay
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            )}
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="1200px" py={6}>
        {dssResults.loading ? (
          <VStack spacing={4} py={20}>
            <CircularProgress isIndeterminate color={BRAND_PRIMARY} size="60px" />
            <Text color="gray.600">Đang tìm kiếm phòng phù hợp nhất...</Text>
          </VStack>
        ) : dssResults.error ? (
          <VStack spacing={4} py={20}>
            <Icon as={FiCheckCircle} w={12} h={12} color="red.500" />
            <Text color="gray.600">{dssResults.error}</Text>
            <Button onClick={fetchRecommendations} colorScheme="orange">
              Thử lại
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Results Summary */}
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600">
                Tìm thấy <Text as="span" fontWeight="700">{dssResults.ranked_rooms.length}</Text> phòng phù hợp
              </Text>
              <Badge colorScheme="green" p={2} borderRadius="6px">
                ✨ Sắp xếp theo độ phù hợp
              </Badge>
            </HStack>

            {/* Room Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {dssResults.ranked_rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </SimpleGrid>
          </VStack>
        )}
      </Container>

      {/* Smart Filter Modal */}
      <SmartFilterModal isOpen={isFilterOpen} onClose={onFilterClose} />

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={onCompareClose}
        rooms={selectedForCompare}
      />
    </Box>
  );
};

export default SearchPage;
