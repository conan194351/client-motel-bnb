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
  Box,
  SimpleGrid,
  Badge,
  Heading,
  Divider,
} from '@chakra-ui/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { BRAND_PRIMARY } from '../constants/colors';

const COLORS = [BRAND_PRIMARY, '#4299E1', '#48BB78'];

const CompareModal = ({ isOpen, onClose, rooms }) => {
  if (!rooms || rooms.length === 0) {
    return null;
  }

  // Prepare data for Radar Chart
  const prepareRadarData = () => {
    if (!rooms[0]?.normalized_values) return [];

    const criteria = Object.keys(rooms[0].normalized_values);
    const criteriaLabels = {
      price: 'Price',
      comfort: 'Amenities',
      distance: 'Location',
      view: 'View',
      cleanliness: 'Cleanliness',
    };

    return criteria.map((criterion) => {
      const dataPoint = {
        criterion: criteriaLabels[criterion] || criterion,
        fullMark: 1,
      };

      rooms.forEach((room, index) => {
        dataPoint[`room${index}`] = room.normalized_values[criterion] || 0;
      });

      return dataPoint;
    });
  };

  const radarData = prepareRadarData();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">📊 Detailed Comparison</Heading>
            <Text fontSize="sm" fontWeight="normal" color="gray.600">
              Analyze criteria to make the best decision
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Radar Chart */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700">
                Multi-Criteria Comparison Chart
              </Heading>
              <Box
                bg="gray.50"
                p={6}
                borderRadius="12px"
                border="1px solid"
                borderColor="gray.200"
              >
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#CBD5E0" />
                    <PolarAngleAxis
                      dataKey="criterion"
                      tick={{ fill: '#4A5568', fontSize: 14, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 1]}
                      tick={{ fill: '#718096', fontSize: 12 }}
                    />
                    {rooms.map((room, index) => (
                      <Radar
                        key={room.id}
                        name={room.name}
                        dataKey={`room${index}`}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      formatter={(value) => (value * 100).toFixed(0) + '%'}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Divider />

            {/* Detailed Comparison Table */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700">
                Detailed Comparison
              </Heading>
              
              <SimpleGrid columns={rooms.length + 1} spacing={4}>
                {/* Header Row */}
                <Box />
                {rooms.map((room, index) => (
                  <Box
                    key={room.id}
                    p={4}
                    bg={`${COLORS[index % COLORS.length]}15`}
                    borderRadius="12px"
                    border="2px solid"
                    borderColor={COLORS[index % COLORS.length]}
                  >
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="700" fontSize="md" noOfLines={1}>
                        {room.name}
                      </Text>
                      <Badge
                        colorScheme="orange"
                        fontSize="lg"
                        p={2}
                        borderRadius="8px"
                        textAlign="center"
                      >
                        {Math.round(room.topsis_score * 100)}% Match
                      </Badge>
                    </VStack>
                  </Box>
                ))}

                {/* Price Row */}
                <Box p={3} fontWeight="600" color="gray.700">
                  💰 Price/night
                </Box>
                {rooms.map((room) => (
                  <Box
                    key={`price-${room.id}`}
                    p={3}
                    bg="white"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontWeight="700" color={BRAND_PRIMARY}>
                      ${room.price?.toLocaleString('en-US')}
                    </Text>
                  </Box>
                ))}

                {/* Rating Row */}
                <Box p={3} fontWeight="600" color="gray.700">
                  ⭐ Rating
                </Box>
                {rooms.map((room) => (
                  <Box
                    key={`rating-${room.id}`}
                    p={3}
                    bg="white"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontWeight="600">
                      {room.rating} ({room.reviews} reviews)
                    </Text>
                  </Box>
                ))}

                {/* Distance Row */}
                <Box p={3} fontWeight="600" color="gray.700">
                  📍 Distance
                </Box>
                {rooms.map((room) => (
                  <Box
                    key={`distance-${room.id}`}
                    p={3}
                    bg="white"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontWeight="600">{parseFloat(room.distance).toFixed(2)} km</Text>
                  </Box>
                ))}

                {/* Explanation Row */}
                <Box p={3} fontWeight="600" color="gray.700">
                  💡 Why Recommended
                </Box>
                {rooms.map((room) => (
                  <Box
                    key={`explanation-${room.id}`}
                    p={3}
                    bg="white"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontSize="sm" color="gray.600">
                      {room.explanation}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Trade-off Insights */}
            <Box
              bg="blue.50"
              p={4}
              borderRadius="12px"
              border="1px solid"
              borderColor="blue.200"
            >
              <HStack spacing={2} mb={2}>
                <Text fontSize="lg">💡</Text>
                <Heading size="sm" color="blue.800">
                  Trade-off Analysis
                </Heading>
              </HStack>
              <Text fontSize="sm" color="blue.700">
                From the chart above, you can clearly see the strengths and weaknesses of each room. 
                The room with the most balanced shape is a well-rounded choice. The room with the highest 
                score best matches your selected priorities.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CompareModal;

