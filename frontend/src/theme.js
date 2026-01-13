import { extendTheme } from '@chakra-ui/react';

// Design System Theme for Chakra UI v2
const theme = extendTheme({
  colors: {
    brand: {
      50: '#FFF5F2',
      100: '#FFE5DE',
      200: '#FFCAB8',
      300: '#FFAF91',
      400: '#FF946B',
      500: '#FF7A45', // Main accent color - Coral Orange
      600: '#E65D2E',
      700: '#CC4517',
      800: '#B32F05',
      900: '#991D00',
    },
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
  },
  radii: {
    card: '12px',
    button: '10px',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '10px',
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '12px',
          boxShadow: 'sm',
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
  },
});

export default theme;
