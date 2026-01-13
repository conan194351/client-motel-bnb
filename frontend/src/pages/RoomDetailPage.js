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
  Avatar,
  Heading,
  Grid,
  Divider,
  Badge,
  Icon,
  CircularProgress,
  CircularProgressLabel,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FiChevronLeft,
  FiHeart,
  FiShare2,
  FiWifi,
  FiMonitor,
  FiCoffee,
  FiTruck,
  FiMapPin,
  FiMessageCircle,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { MdPool, MdBalcony, MdKitchen, MdLocalLaundryService } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useDSS } from '../contexts/DSSContext';
import { BRAND_PRIMARY } from '../constants/colors';

const RoomDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { dssResults } = useDSS();
  
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [roomData, setRoomData] = useState(null);

  // Find room data from DSS results
  useEffect(() => {
    const room = dssResults.ranked_rooms.find(r => r.id === parseInt(id));
    if (room) {
      setRoomData(enrichRoomData(room));
    } else {
      // Fallback to mock data
      setRoomData(getMockRoomData());
    }
  }, [id, dssResults]);

  if (!roomData) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <CircularProgress isIndeterminate color={BRAND_PRIMARY} />
      </Flex>
    );
  }

  const topsisPercent = Math.round(roomData.topsis_score * 100);

  // Prepare Radar Chart data
  const getRadarData = () => {
    if (!roomData.normalized_values) return [];
    
    const criteriaLabels = {
      price: 'Giá cả',
      comfort: 'Tiện nghi',
      distance: 'Vị trí',
      view: 'View',
      cleanliness: 'Vệ sinh',
    };

    return Object.entries(roomData.normalized_values).map(([key, value]) => ({
      criterion: criteriaLabels[key] || key,
      value: value,
      fullMark: 1,
    }));
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Sticky Header */}
      <Box
        position="sticky"
        top={0}
        bg="white"
        boxShadow="sm"
        zIndex={10}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Container maxW="1200px" py={3}>
          <Flex justify="space-between" align="center">
            <Button
              variant="ghost"
              onClick={() => navigate('/search')}
              leftIcon={<Icon as={FiChevronLeft} />}
            >
              Quay lại
            </Button>
            
            <HStack>
              <Button variant="ghost" leftIcon={<Icon as={FiShare2} />}>
                Chia sẻ
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Icon
                  as={FiHeart}
                  color={isFavorite ? 'red.500' : 'gray.600'}
                  fill={isFavorite ? 'red.500' : 'none'}
                />
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Image Gallery */}
      <Container maxW="1200px" py={6}>
        <Box position="relative" borderRadius="16px" overflow="hidden" mb={6}>
          <Image
            src={roomData.images[currentImageIndex]}
            alt={roomData.name}
            w="100%"
            h="500px"
            objectFit="cover"
          />
          
          {/* Image Navigation */}
          <HStack
            position="absolute"
            bottom={4}
            left="50%"
            transform="translateX(-50%)"
            bg="blackAlpha.700"
            borderRadius="full"
            p={2}
            spacing={2}
          >
            {roomData.images.map((_, index) => (
              <Box
                key={index}
                w={2}
                h={2}
                borderRadius="full"
                bg={currentImageIndex === index ? 'white' : 'whiteAlpha.500'}
                cursor="pointer"
                onClick={() => setCurrentImageIndex(index)}
                transition="all 0.2s"
                _hover={{ bg: 'white' }}
              />
            ))}
          </HStack>
        </Box>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Main Content */}
          <VStack align="stretch" spacing={6}>
            {/* Title & TOPSIS Score */}
            <Box>
              <Flex justify="space-between" align="start" mb={4}>
                <VStack align="start" spacing={2} flex={1}>
                  <Heading size="lg">{roomData.name}</Heading>
                  <HStack color="gray.600">
                    <Icon as={FiMapPin} />
                    <Text>{roomData.location}</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="yellow" fontSize="md" p={2}>
                      ⭐ {roomData.rating}
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                      ({roomData.reviewCount} đánh giá)
                    </Text>
                  </HStack>
                </VStack>

                {/* TOPSIS Score Display */}
                {roomData.topsis_score && (
                  <VStack>
                    <CircularProgress
                      value={topsisPercent}
                      size="100px"
                      color={topsisPercent >= 85 ? 'green.500' : topsisPercent >= 70 ? 'blue.500' : 'yellow.500'}
                      trackColor="gray.200"
                      thickness="8px"
                    >
                      <CircularProgressLabel fontSize="xl" fontWeight="700">
                        {topsisPercent}%
                      </CircularProgressLabel>
                    </CircularProgress>
                    <Badge colorScheme="purple" fontSize="sm" p={2}>
                      Smart Match Score
                    </Badge>
                  </VStack>
                )}
              </Flex>

              {/* Explanation Badge */}
              {roomData.explanation && (
                <Box
                  bg="purple.50"
                  p={4}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="purple.200"
                >
                  <HStack>
                    <Text fontSize="lg">💡</Text>
                    <Text fontSize="sm" fontWeight="600" color="purple.800">
                      {roomData.explanation}
                    </Text>
                  </HStack>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Host Info */}
            <HStack spacing={4} p={4} bg="gray.50" borderRadius="12px">
              <Avatar name={roomData.host.name} src={roomData.host.avatar} size="lg" />
              <VStack align="start" spacing={1} flex={1}>
                <HStack>
                  <Text fontWeight="700">{roomData.host.name}</Text>
                  {roomData.host.verified && (
                    <Badge colorScheme="green" display="flex" alignItems="center">
                      <Icon as={FiCheck} mr={1} />
                      Đã xác minh
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Phản hồi: {roomData.host.responseTime}
                </Text>
              </VStack>
              <Button
                leftIcon={<Icon as={FiMessageCircle} />}
                bg={BRAND_PRIMARY}
                color="white"
                _hover={{ bg: 'brand.600' }}
              >
                Chat ngay
              </Button>
            </HStack>

            <Divider />

            {/* Room Specs */}
            <Box>
              <Heading size="md" mb={4}>Thông tin phòng</Heading>
              <SimpleGrid columns={4} spacing={4}>
                <VStack>
                  <Text fontSize="2xl">👥</Text>
                  <Text fontSize="sm" fontWeight="600">{roomData.specs.guests} khách</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl">🛏️</Text>
                  <Text fontSize="sm" fontWeight="600">{roomData.specs.bedrooms} phòng ngủ</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl">🛏️</Text>
                  <Text fontSize="sm" fontWeight="600">{roomData.specs.beds} giường</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl">🚿</Text>
                  <Text fontSize="sm" fontWeight="600">{roomData.specs.bathrooms} WC</Text>
                </VStack>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* DSS Radar Chart */}
            {roomData.normalized_values && (
              <Box>
                <Heading size="md" mb={4}>Phân tích đa tiêu chí</Heading>
                <Box
                  bg="gray.50"
                  p={6}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid stroke="#CBD5E0" />
                      <PolarAngleAxis
                        dataKey="criterion"
                        tick={{ fill: '#4A5568', fontSize: 12, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 1]}
                        tick={{ fill: '#718096', fontSize: 10 }}
                      />
                      <Radar
                        name={roomData.name}
                        dataKey="value"
                        stroke={BRAND_PRIMARY}
                        fill={BRAND_PRIMARY}
                        fillOpacity={0.5}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <Text fontSize="sm" color="gray.600" textAlign="center" mt={4}>
                    Biểu đồ thể hiện điểm mạnh của phòng theo các tiêu chí đánh giá
                  </Text>
                </Box>
              </Box>
            )}

            <Divider />

            {/* Amenities */}
            <Box>
              <Heading size="md" mb={4}>Tiện nghi</Heading>
              <SimpleGrid columns={2} spacing={3}>
                {roomData.amenities.map((amenity, index) => (
                  <HStack key={index} spacing={3}>
                    <Icon as={amenity.icon} w={5} h={5} color={BRAND_PRIMARY} />
                    <Text fontSize="sm">{amenity.name}</Text>
                  </HStack>
                ))}
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Description */}
            <Box>
              <Heading size="md" mb={4}>Mô tả</Heading>
              <Box
                maxH={isDescriptionOpen ? 'none' : '100px'}
                overflow="hidden"
                position="relative"
              >
                <Text color="gray.700" whiteSpace="pre-line">
                  {roomData.description}
                </Text>
                {!isDescriptionOpen && (
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    h="50px"
                    bgGradient="linear(to-b, transparent, white)"
                  />
                )}
              </Box>
              <Button
                mt={3}
                variant="link"
                color={BRAND_PRIMARY}
                rightIcon={<Icon as={isDescriptionOpen ? FiChevronUp : FiChevronDown} />}
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              >
                {isDescriptionOpen ? 'Thu gọn' : 'Đọc thêm'}
              </Button>
            </Box>

            <Divider />

            {/* Reviews Section */}
            <Box>
              <Heading size="md" mb={4}>Đánh giá</Heading>
              <VStack align="stretch" spacing={4}>
                {roomData.reviews.slice(0, 2).map((review) => (
                  <Box key={review.id} p={4} bg="gray.50" borderRadius="12px">
                    <HStack mb={3}>
                      <Avatar name={review.user} src={review.avatar} size="sm" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="600" fontSize="sm">{review.user}</Text>
                        <Text fontSize="xs" color="gray.500">{review.date}</Text>
                      </VStack>
                      <Badge colorScheme="yellow">⭐ {review.rating}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.700">{review.comment}</Text>
                  </Box>
                ))}
              </VStack>
              <Button
                mt={4}
                variant="outline"
                w="100%"
                onClick={() => {}}
              >
                Xem tất cả {roomData.reviewCount} đánh giá
              </Button>
            </Box>
          </VStack>

          {/* Booking Sidebar */}
          <Box position="sticky" top="80px" h="fit-content">
            <Box
              p={6}
              bg="white"
              borderRadius="16px"
              boxShadow="xl"
              border="1px solid"
              borderColor="gray.200"
            >
              <VStack align="stretch" spacing={4}>
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="2xl" fontWeight="700" color={BRAND_PRIMARY}>
                      {roomData.price?.toLocaleString('vi-VN')}₫
                    </Text>
                    <Text fontSize="sm" color="gray.600">/ đêm</Text>
                  </HStack>
                  {roomData.topsis_score && (
                    <Badge colorScheme="green" fontSize="sm" p={2} w="100%">
                      🎯 {topsisPercent}% phù hợp với bạn
                    </Badge>
                  )}
                </Box>

                <Divider />

                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="600">Nhận phòng</Text>
                  <Input type="date" />
                  
                  <Text fontSize="sm" fontWeight="600" mt={2}>Trả phòng</Text>
                  <Input type="date" />
                  
                  <Text fontSize="sm" fontWeight="600" mt={2}>Số khách</Text>
                  <Input type="number" defaultValue={2} min={1} max={roomData.specs.guests} />
                </VStack>

                <Button
                  size="lg"
                  bg={BRAND_PRIMARY}
                  color="white"
                  _hover={{ bg: 'brand.600' }}
                  w="100%"
                >
                  Đặt ngay
                </Button>

                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Bạn chưa bị tính phí
                </Text>
              </VStack>
            </Box>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};

// Enrich room data with full details
function enrichRoomData(room) {
  return {
    ...room,
    images: [
      room.image,
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    host: {
      name: 'Nguyễn Minh Anh',
      avatar: 'https://i.pravatar.cc/150?img=1',
      responseTime: '< 1 giờ',
      verified: true,
    },
    amenities: [
      { icon: FiWifi, name: 'Wifi miễn phí', available: true },
      { icon: MdPool, name: 'Bể bơi', available: true },
      { icon: FiMonitor, name: 'Điều hòa', available: true },
      { icon: MdKitchen, name: 'Bếp đầy đủ', available: true },
      { icon: FiTruck, name: 'Bãi đỗ xe', available: true },
      { icon: MdBalcony, name: 'Ban công', available: true },
      { icon: MdLocalLaundryService, name: 'Máy giặt', available: true },
      { icon: FiCoffee, name: 'Máy pha cà phê', available: true },
    ],
    description: `Căn hộ sang trọng với view tuyệt đẹp, nằm ở vị trí đắc địa. 
    
Không gian được thiết kế hiện đại, trang nhã với đầy đủ tiện nghi cao cấp. Phòng ngủ rộng rãi, thoáng mát với giường king size êm ái. Phòng khách được trang trí sang trọng với sofa thoải mái và TV màn hình lớn.

Đặc biệt, căn hộ có ban công riêng với view tuyệt đẹp, lý tưởng để thư giãn. Bếp được trang bị đầy đủ dụng cụ nấu nướng hiện đại.

Vị trí thuận lợi, gần các nhà hàng, quán cafe và trung tâm mua sắm.`,
    specs: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
    },
    reviews: [
      {
        id: 1,
        user: 'Trần Văn Bình',
        avatar: 'https://i.pravatar.cc/150?img=12',
        rating: 5,
        date: '2 tuần trước',
        comment: 'Căn hộ rất đẹp! Chủ nhà thân thiện và nhiệt tình. Chắc chắn sẽ quay lại lần sau.',
      },
      {
        id: 2,
        user: 'Lê Thị Hương',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        date: '3 tuần trước',
        comment: 'Phòng sạch sẽ, tiện nghi đầy đủ. Rất hài lòng!',
      },
    ],
  };
}

// Mock data fallback
function getMockRoomData() {
  return enrichRoomData({
    id: 1,
    name: 'Căn hộ cao cấp view biển tuyệt đẹp',
    location: 'Sơn Trà, Đà Nẵng',
    price: 850000,
    rating: 4.9,
    reviewCount: 128,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    topsis_score: 0.88,
    explanation: 'Cân bằng tốt giữa giá cả và tiện nghi',
    distance: 2.5,
    normalized_values: {
      price: 0.85,
      comfort: 0.90,
      distance: 0.88,
      view: 0.92,
      cleanliness: 0.87,
    },
  });
}

// Missing Input component import - add to Chakra imports
const Input = ({ ...props }) => (
  <input
    {...props}
    style={{
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      fontSize: '14px',
      width: '100%',
    }}
  />
);

export default RoomDetailPage;
