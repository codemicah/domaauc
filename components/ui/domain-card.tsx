'use client';

import { DomainToken } from '@/lib/doma/types';
import Image from 'next/image';
import { useState } from 'react';

interface DomainCardProps {
  domain: DomainToken;
  isSelected: boolean;
  onSelect: (domain: DomainToken) => void;
}

export function DomainCard({
  domain,
  isSelected,
  onSelect,
}: DomainCardProps): React.ReactElement {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`glass-card cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-400 bg-white/10' : 'hover:bg-white/8'
      }`}
      onClick={() => onSelect(domain)}
    >
      {/* <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-white/5">
        {domain.image && !imageError ? (
          <Image
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
      </div> */}

      <h3 className="text-lg font-semibold text-white mb-2 truncate text-center">
        {domain.name}
      </h3>

      {domain.description && (
        <p className="text-sm text-white/70 mb-3 line-clamp-2">
          {domain.description}
        </p>
      )}

      <div className="space-y-2">
        {/* <div className="flex items-center justify-between text-xs text-white/50">
          <span className="truncate flex-1 mr-2">Token ID:</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate max-w-[120px]" title={domain.tokenId}>
              {domain.tokenId}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(domain.tokenId);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              title="Copy Token ID"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div> */}
        {/* <div className="flex items-center justify-between text-xs text-white/50">
          <span className="truncate flex-1 mr-2">Contract:</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate" title={domain.tokenContract}>
              {domain.tokenContract.slice(0, 6)}...
              {domain.tokenContract.slice(-4)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(domain.tokenContract);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              title="Copy Contract Address"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
