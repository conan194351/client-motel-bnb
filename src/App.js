import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import RoomDetailPage from './pages/RoomDetailPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/room/:id" element={<RoomDetailPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
