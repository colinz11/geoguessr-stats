import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-4 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Full page loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">{text}</p>
      </div>
    </div>
  );
}

// Inline loading spinner
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}
