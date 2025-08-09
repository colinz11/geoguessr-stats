import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import InteractiveMap from './components/InteractiveMap';

// Placeholder components for future development
const Countries = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Countries Page</h1>
    <p className="text-gray-600">Country performance analysis coming soon!</p>
  </div>
);

const Settings = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings Page</h1>
    <p className="text-gray-600">User settings and preferences coming soon!</p>
  </div>
);

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<InteractiveMap />} />
        <Route path="/countries" element={<Countries />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
