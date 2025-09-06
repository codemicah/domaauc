'use client';

import { DomainToken } from '@/lib/doma/types';
import { useState } from 'react';

interface DomainCardProps {
  domain: DomainToken;
  isSelected: boolean;
  onSelect: (domain: DomainToken) => void;
}

export function DomainCard({ domain, isSelected, onSelect }: DomainCardProps): React.ReactElement {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`glass-card cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-400 bg-white/10' : 'hover:bg-white/8'
      }`}
      onClick={() => onSelect(domain)}
    >
      <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-white/5">
        {domain.image && !imageError ? (
          <img
            src={domain.image}
            alt={domain.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"
              />
            </svg>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2 truncate">
        {domain.name}
      </h3>
      
      {domain.description && (
        <p className="text-sm text-white/70 mb-3 line-clamp-2">
          {domain.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Token ID: {domain.tokenId}</span>
        <span className="truncate ml-2">
          {domain.tokenContract.slice(0, 6)}...{domain.tokenContract.slice(-4)}
        </span>
      </div>
    </div>
  );
}
