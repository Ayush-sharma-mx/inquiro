import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'draft' | 'published';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'draft', className = '' }) => {
  const variants = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
