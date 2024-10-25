import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { GarageProvider } from './src/context/GarageContext';
import Navigation from './src/components/Navigation';

const App = () => {
  return (
    <AuthProvider>
      <GarageProvider>
        <Navigation />
      </GarageProvider>
    </AuthProvider>
  );
};

export default App;
