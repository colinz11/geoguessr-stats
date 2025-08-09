import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, BarChart3, Globe, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Interactive Map', href: '/map', icon: Map },
  { name: 'Countries', href: '/countries', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children, currentPage }: LayoutProps) {
  const location = useLocation();
  
  // Determine current page from route if not provided
  const getCurrentPage = () => {
    if (currentPage) return currentPage;
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/map': return 'Interactive Map';
      case '/countries': return 'Countries';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };
  
  const activeCurrentPage = getCurrentPage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Globe className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  GeoGuessr Stats
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.name === activeCurrentPage;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              GeoGuessr Stats Dashboard • Built with React & TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
