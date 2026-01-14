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
  SliderMark,
  Box,
  Heading,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiDollarSign, FiHome, FiMapPin, FiEye, FiCheck } from 'react-icons/fi';
import { useDSS } from '../contexts/DSSContext';
import { BRAND_PRIMARY } from '../constants/colors';

const PreferenceSlider = ({ icon, label, description, value, onChange }) => {
  const getColor = () => {
    if (value <= 3) return 'red.500';
    if (value <= 6) return 'yellow.500';
    return 'green.500';
  };

  const getLabel = () => {
    if (value <= 3) return 'Low';
    if (value <= 6) return 'Medium';
    if (value <= 8) return 'High';
    return 'Very High';
  };

  return (
    <Box>
      <HStack mb={3} justify="space-between">
        <HStack>
          <Icon as={icon} color={BRAND_PRIMARY} boxSize={5} />
          <VStack align="start" spacing={0}>
            <Text fontWeight="600" fontSize="sm">
              {label}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {description}
            </Text>
          </VStack>
        </HStack>
        <Badge colorScheme={value <= 3 ? 'red' : value <= 6 ? 'yellow' : 'green'} fontSize="md" px={3} py={1}>
          {value}/10
        </Badge>
      </HStack>
      
      <Box px={2}>
        <Slider
          value={value}
          min={1}
          max={10}
          step={1}
          onChange={onChange}
          colorScheme="orange"
        >
          <SliderMark value={1} mt={2} ml={-2} fontSize="xs" color="gray.500">
            1
          </SliderMark>
          <SliderMark value={5} mt={2} ml={-2} fontSize="xs" color="gray.500">
            5
          </SliderMark>
          <SliderMark value={10} mt={2} ml={-2} fontSize="xs" color="gray.500">
            10
          </SliderMark>
          <SliderTrack bg="gray.200">
            <SliderFilledTrack bg={getColor()} />
          </SliderTrack>
          <SliderThumb boxSize={6} bg={getColor()}>
            <Text fontSize="xs" fontWeight="bold" color="white">
              {value}
            </Text>
          </SliderThumb>
        </Slider>
      </Box>
      
      <Text fontSize="xs" color="gray.600" mt={4} textAlign="center" fontWeight="500">
        {getLabel()}
      </Text>
    </Box>
  );
};

const SmartFilterModal = ({ isOpen, onClose }) => {
  const {
    preferences,
    updatePreference,
    resetPreferences,
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
            <Heading size="md">🎯 Rate Importance Level</Heading>
            <Text fontSize="sm" fontWeight="normal" color="gray.600">
              Score each criterion from 1-10 to get the best recommendations
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={8} align="stretch">
            <PreferenceSlider
              icon={FiDollarSign}
              label="Price"
              description="How much do you care about price?"
              value={preferences.price_sensitivity}
              onChange={(val) => updatePreference('price_sensitivity', val)}
            />
            
            <PreferenceSlider
              icon={FiHome}
              label="Amenities"
              description="Importance of room amenities"
              value={preferences.comfort_priority}
              onChange={(val) => updatePreference('comfort_priority', val)}
            />
            
            <PreferenceSlider
              icon={FiMapPin}
              label="Location"
              description="How close should the room be?"
              value={preferences.distance_tolerance}
              onChange={(val) => updatePreference('distance_tolerance', val)}
            />
            
            <PreferenceSlider
              icon={FiEye}
              label="View & Scenery"
              description="Importance of view and scenery"
              value={preferences.view_importance}
              onChange={(val) => updatePreference('view_importance', val)}
            />
            
            <PreferenceSlider
              icon={FiCheck}
              label="Cleanliness"
              description="Importance of cleanliness"
              value={preferences.cleanliness_priority}
              onChange={(val) => updatePreference('cleanliness_priority', val)}
            />
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

