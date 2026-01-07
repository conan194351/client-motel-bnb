import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  IconButton,
  Avatar,
  Heading,
  Grid,
  Divider,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { 
  FiChevronLeft,
  FiHeart,
  FiShare2,
  FiWifi,
  FiMonitor,
  FiCoffee,
  FiTruck,
  FiStar,
  FiMapPin,
  FiMessageCircle,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { MdPool, MdBalcony, MdKitchen, MdLocalLaundryService } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { BRAND_PRIMARY } from '../constants/colors';

const RoomDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const roomData = {
    id: 1,
    name: 'Căn hộ cao cấp view biển tuyệt đẹp',
    location: 'Sơn Trà, Đà Nẵng, Việt Nam',
    price: '850.000',
    rating: 4.9,
    reviewCount: 128,
    host: {
      name: 'Nguyễn Minh Anh',
      avatar: 'https://i.pravatar.cc/150?img=1',
      responseTime: '< 1 giờ',
      verified: true,
    },
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
    ],
    amenities: [
      { icon: FiWifi, name: 'Wifi miễn phí', available: true },
      { icon: MdPool, name: 'Bể bơi', available: true },
      { icon: FiMonitor, name: 'Điều hòa', available: true },
      { icon: MdKitchen, name: 'Bếp đầy đủ', available: true },
      { icon: FiTruck, name: 'Bãi đỗ xe', available: true },
      { icon: MdBalcony, name: 'Ban công view biển', available: true },
      { icon: MdLocalLaundryService, name: 'Máy giặt', available: true },
      { icon: FiCoffee, name: 'Máy pha cà phê', available: true },
    ],
    description: `Căn hộ sang trọng với view biển tuyệt đẹp, nằm ở vị trí đắc địa tại bán đảo Sơn Trà. 
    
Không gian được thiết kế hiện đại, trang nhã với đầy đủ tiện nghi cao cấp. Phòng ngủ rộng rãi, thoáng mát với giường king size êm ái. Phòng khách được trang trí sang trọng với sofa thoải mái và TV màn hình lớn.

Đặc biệt, căn hộ có ban công riêng với view nhìn ra biển Đà Nẵng tuyệt đẹp, lý tưởng để ngắm hoàng hôn. Bếp được trang bị đầy đủ dụng cụ nấu nướng hiện đại.

Vị trí thuận lợi, chỉ 5 phút đi bộ đến bãi biển Mỹ Khê nổi tiếng, gần các nhà hàng, quán cafe và trung tâm mua sắm.`,
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
        comment: 'Căn hộ rất đẹp, view biển tuyệt vời! Chủ nhà thân thiện và nhiệt tình. Chắc chắn sẽ quay lại lần sau.',
      },
      {
        id: 2,
        user: 'Lê Thị Hương',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        date: '3 tuần trước',
        comment: 'Không gian sạch sẽ, tiện nghi đầy đủ. Vị trí tuyệt vời gần biển. Recommend!',
      },
    ],
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <Box minH="100vh" bg="white" pb="80px">
      {/* Header */}
      <Box 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        position="sticky" 
        top={0} 
        zIndex={10}
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={3}>
          <Flex justify="space-between" align="center">
            <IconButton
              icon={<FiChevronLeft />}
              onClick={() => navigate(-1)}
              variant="ghost"
              aria-label="Back"
            />
            <HStack>
              <IconButton
                icon={<FiShare2 />}
                variant="ghost"
                aria-label="Share"
              />
              <IconButton
                icon={<FiHeart />}
                variant="ghost"
                color={isFavorite ? 'red.500' : 'gray.600'}
                onClick={() => setIsFavorite(!isFavorite)}
                aria-label="Favorite"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Image Carousel */}
      <Box position="relative" h="400px" bg="gray.100">
        <Image
          src={roomData.images[currentImageIndex]}
          alt={roomData.name}
          w="100%"
          h="100%"
          objectFit="cover"
        />
        
        {/* Image Navigation Dots */}
        <HStack
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
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
            />
          ))}
        </HStack>

        {/* Thumbnail Preview */}
        <HStack
          position="absolute"
          bottom={4}
          right={4}
          spacing={2}
          display={{ base: 'none', md: 'flex' }}
        >
          {roomData.images.slice(0, 4).map((img, index) => (
            <Box
              key={index}
              w="60px"
              h="60px"
              borderRadius="8px"
              overflow="hidden"
              border={currentImageIndex === index ? '2px' : '0'}
              borderColor="white"
              cursor="pointer"
              onClick={() => setCurrentImageIndex(index)}
            >
              <Image src={img} w="100%" h="100%" objectFit="cover" />
            </Box>
          ))}
        </HStack>
      </Box>

      <Container maxW="container.xl" py={6}>
        {/* Title and Host */}
        <VStack align="stretch" spacing={4}>
          <Box>
            <Heading size="lg" mb={2}>
              {roomData.name}
            </Heading>
            <Flex align="center" gap={2} color="gray.600">
              <FiMapPin />
              <Text fontSize="sm">{roomData.location}</Text>
            </Flex>
          </Box>

          {/* Rating and Specs */}
          <Flex gap={4} flexWrap="wrap" fontSize="sm">
            <Flex align="center" gap={1}>
              <FiStar color={BRAND_PRIMARY} />
              <Text fontWeight="600">{roomData.rating}</Text>
              <Text color="gray.600">({roomData.reviewCount} đánh giá)</Text>
            </Flex>
            <Text color="gray.600">•</Text>
            <Text>{roomData.specs.guests} khách</Text>
            <Text color="gray.600">•</Text>
            <Text>{roomData.specs.bedrooms} phòng ngủ</Text>
            <Text color="gray.600">•</Text>
            <Text>{roomData.specs.beds} giường</Text>
            <Text color="gray.600">•</Text>
            <Text>{roomData.specs.bathrooms} phòng tắm</Text>
          </Flex>

          <Divider />

          {/* Host Info */}
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={3}>
              <Avatar src={roomData.host.avatar} size="md" />
              <VStack align="start" spacing={0}>
                <Flex align="center" gap={2}>
                  <Text fontWeight="600">{roomData.host.name}</Text>
                  {roomData.host.verified && (
                    <Badge bg="green.500" color="white" fontSize="xs">
                      <Flex align="center" gap={1}>
                        <FiCheck size={12} /> Đã xác thực
                      </Flex>
                    </Badge>
                  )}
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  Phản hồi {roomData.host.responseTime}
                </Text>
              </VStack>
            </Flex>
            <Button 
              leftIcon={<FiMessageCircle />}
              variant="outline"
              size="sm"
              borderRadius="10px"
            >
              Chat ngay
            </Button>
          </Flex>

          <Divider />

          {/* Amenities */}
          <Box>
            <Heading size="md" mb={4}>
              Tiện ích
            </Heading>
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={3}>
              {roomData.amenities.slice(0, 6).map((amenity, index) => {
                const IconComponent = amenity.icon;
                return (
                  <Flex key={index} align="center" gap={3}>
                    <IconComponent size={20} color={BRAND_PRIMARY} />
                    <Text fontSize="sm">{amenity.name}</Text>
                  </Flex>
                );
              })}
            </Grid>
            {roomData.amenities.length > 6 && (
              <Button 
                variant="outline" 
                size="sm" 
                mt={4}
                borderRadius="10px"
              >
                Xem tất cả {roomData.amenities.length} tiện ích
              </Button>
            )}
          </Box>

          <Divider />

          {/* Description */}
          <Box>
            <Heading size="md" mb={3}>
              Mô tả
            </Heading>
            <Box 
              maxH={isDescriptionOpen ? "none" : "80px"} 
              overflow="hidden"
              position="relative"
            >
              <Text color="gray.700" whiteSpace="pre-line" lineHeight="tall">
                {roomData.description}
              </Text>
            </Box>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              rightIcon={isDescriptionOpen ? <FiChevronUp /> : <FiChevronDown />}
              mt={2}
            >
              {isDescriptionOpen ? 'Thu gọn' : 'Đọc thêm'}
            </Button>
          </Box>

          <Divider />

          {/* Reviews */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">
                Đánh giá
              </Heading>
              <Flex align="center" gap={2}>
                <FiStar color={BRAND_PRIMARY} size={20} />
                <Text fontSize="lg" fontWeight="700">
                  {roomData.rating}
                </Text>
                <Text color="gray.600">({roomData.reviewCount} đánh giá)</Text>
              </Flex>
            </Flex>

            <VStack spacing={4} align="stretch">
              {roomData.reviews.slice(0, 2).map((review) => (
                <Box 
                  key={review.id} 
                  borderRadius="12px" 
                  border="1px" 
                  borderColor="gray.200"
                  bg="white"
                  p={4}
                >
                  <Flex gap={3}>
                    <Avatar src={review.avatar} size="sm" />
                    <VStack align="start" spacing={1} flex={1}>
                      <Flex justify="space-between" w="100%">
                        <Text fontWeight="600" fontSize="sm">
                          {review.user}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {review.date}
                        </Text>
                      </Flex>
                      <Flex gap={0.5}>
                        {[...Array(review.rating)].map((_, i) => (
                          <FiStar key={i} color={BRAND_PRIMARY} size={12} fill={BRAND_PRIMARY} />
                        ))}
                      </Flex>
                      <Text fontSize="sm" color="gray.700" mt={2}>
                        {review.comment}
                      </Text>
                    </VStack>
                  </Flex>
                </Box>
              ))}
            </VStack>

            <Button 
              variant="outline" 
              w="100%" 
              mt={4}
              borderRadius="10px"
            >
              Xem tất cả {roomData.reviewCount} đánh giá
            </Button>
          </Box>

          <Divider />

          {/* Location */}
          <Box>
            <Heading size="md" mb={3}>
              Vị trí
            </Heading>
            <Box
              h="200px"
              bg="gray.100"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.500">Bản đồ hiển thị tại đây</Text>
            </Box>
          </Box>
        </VStack>
      </Container>

      {/* Sticky Footer - Booking */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
        zIndex={20}
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <Flex align="baseline" gap={1}>
                <Text fontSize="2xl" fontWeight="700" color={BRAND_PRIMARY}>
                  {roomData.price}₫
                </Text>
                <Text fontSize="sm" color="gray.600">
                  /đêm
                </Text>
              </Flex>
              <Flex align="center" gap={1}>
                <FiStar color={BRAND_PRIMARY} size={12} />
                <Text fontSize="sm" fontWeight="600">
                  {roomData.rating}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ({roomData.reviewCount})
                </Text>
              </Flex>
            </VStack>
            
            <Button
              colorScheme="blue"
              size="lg"
              px={8}
              borderRadius="12px"
              boxShadow="lg"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'xl',
              }}
            >
              Đặt ngay
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default RoomDetailPage