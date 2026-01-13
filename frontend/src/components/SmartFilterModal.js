import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Box,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Divider,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { FiDollarSign, FiHome, FiMapPin, FiEye, FiCheck } from 'react-icons/fi';
import { useDSS } from '../contexts/DSSContext';
import { BRAND_PRIMARY } from '../constants/colors';

const PreferenceSlider = ({ icon, label, leftLabel, rightLabel, value, onChange }) => {
  const getColor = () => {
    if (value < 0.33) return 'green.500';
    if (value < 0.67) return 'yellow.500';
    return 'red.500';
  };

  return (
    <Box>
      <HStack mb={2}>
        <Icon as={icon} color={BRAND_PRIMARY} />
        <Text fontWeight="600" fontSize="sm">
          {label}
        </Text>
      </HStack>
      
      <HStack spacing={4} align="center">
        <Text fontSize="xs" color="gray.600" minW="80px">
          {leftLabel}
        </Text>
        
        <Slider
          value={value}
          min={0}
          max={1}
          step={0.1}
          onChange={onChange}
          colorScheme="orange"
        >
          <SliderTrack bg="gray.200">
            <SliderFilledTrack bg={getColor()} />
          </SliderTrack>
          <SliderThumb boxSize={5} bg={getColor()} />
        </Slider>
        
        <Text fontSize="xs" color="gray.600" minW="80px" textAlign="right">
          {rightLabel}
        </Text>
      </HStack>
      
      <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
        {value < 0.33 ? 'Ít quan tâm' : value < 0.67 ? 'Quan tâm' : 'Rất quan tâm'}
      </Text>
    </Box>
  );
};

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Wifi', icon: '📶' },
  { id: 'pool', label: 'Bể bơi', icon: '🏊' },
  { id: 'parking', label: 'Bãi đỗ xe', icon: '🚗' },
  { id: 'kitchen', label: 'Bếp', icon: '🍳' },
  { id: 'ac', label: 'Điều hòa', icon: '❄️' },
  { id: 'balcony', label: 'Ban công', icon: '🏠' },
  { id: 'tv', label: 'TV', icon: '📺' },
  { id: 'washer', label: 'Máy giặt', icon: '🧺' },
];

const SmartFilterModal = ({ isOpen, onClose }) => {
  const {
    preferences,
    updatePreference,
    resetPreferences,
    requiredAmenities,
    toggleAmenity,
    fetchRecommendations,
  } = useDSS();

  const handleApply = async () => {
    await fetchRecommendations();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">🎯 Bộ lọc thông minh</Heading>
            <Text fontSize="sm" fontWeight="normal" color="gray.600">
              Điều chỉnh ưu tiên của bạn để nhận gợi ý phù hợp nhất
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Preference Sliders */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700">
                Mức độ ưu tiên
              </Heading>
              
              <VStack spacing={5}>
                <PreferenceSlider
                  icon={FiDollarSign}
                  label="Giá cả"
                  leftLabel="Chấp nhận đắt"
                  rightLabel="Càng rẻ càng tốt"
                  value={preferences.price_sensitivity}
                  onChange={(val) => updatePreference('price_sensitivity', val)}
                />
                
                <PreferenceSlider
                  icon={FiHome}
                  label="Tiện nghi"
                  leftLabel="Cơ bản"
                  rightLabel="Cao cấp"
                  value={preferences.comfort_priority}
                  onChange={(val) => updatePreference('comfort_priority', val)}
                />
                
                <PreferenceSlider
                  icon={FiMapPin}
                  label="Vị trí"
                  leftLabel="Chấp nhận xa"
                  rightLabel="Phải gần"
                  value={preferences.distance_tolerance}
                  onChange={(val) => updatePreference('distance_tolerance', val)}
                />
                
                <PreferenceSlider
                  icon={FiEye}
                  label="View & Cảnh quan"
                  leftLabel="Không quan trọng"
                  rightLabel="Phải đẹp"
                  value={preferences.view_importance}
                  onChange={(val) => updatePreference('view_importance', val)}
                />
                
                <PreferenceSlider
                  icon={FiCheck}
                  label="Vệ sinh"
                  leftLabel="Chấp nhận được"
                  rightLabel="Rất sạch sẽ"
                  value={preferences.cleanliness_priority}
                  onChange={(val) => updatePreference('cleanliness_priority', val)}
                />
              </VStack>
            </Box>

            <Divider />

            {/* Required Amenities */}
            <Box>
              <Heading size="sm" mb={3} color="gray.700">
                Tiện ích bắt buộc
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Chọn các tiện ích mà bạn cần có
              </Text>
              
              <Wrap spacing={2}>
                {AMENITIES_LIST.map((amenity) => {
                  const isSelected = requiredAmenities.includes(amenity.id);
                  return (
                    <WrapItem key={amenity.id}>
                      <Tag
                        size="lg"
                        variant={isSelected ? 'solid' : 'outline'}
                        bg={isSelected ? BRAND_PRIMARY : 'white'}
                        color={isSelected ? 'white' : 'gray.700'}
                        borderColor={isSelected ? BRAND_PRIMARY : 'gray.300'}
                        cursor="pointer"
                        onClick={() => toggleAmenity(amenity.id)}
                        _hover={{
                          bg: isSelected ? 'brand.600' : 'gray.50',
                        }}
                      >
                        <TagLabel>
                          <HStack spacing={1}>
                            <Text>{amenity.icon}</Text>
                            <Text>{amenity.label}</Text>
                          </HStack>
                        </TagLabel>
                        {isSelected && <TagCloseButton />}
                      </Tag>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={resetPreferences}>
            Đặt lại mặc định
          </Button>
          <Button
            bg={BRAND_PRIMARY}
            color="white"
            _hover={{ bg: 'brand.600' }}
            onClick={handleApply}
          >
            Áp dụng & Tìm kiếm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SmartFilterModal;

