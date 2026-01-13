import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import { DSSProvider } from './contexts/DSSContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import RoomDetailPage from './pages/RoomDetailPage';

function App() {
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

  if (!mapboxToken) {
    console.warn("⚠️ Mapbox token is not set in .env file. Location search may not work.");
  }

  return (
    <ChakraProvider theme={theme}>
      <DSSProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/room/:id" element={<RoomDetailPage />} />
          </Routes>
        </Router>
      </DSSProvider>
    </ChakraProvider>
  );
}

export default App;
