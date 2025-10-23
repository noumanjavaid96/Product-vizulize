
import React from 'react';
import type { MarketingMedium } from '../types';
import { MugIcon, TshirtIcon, BillboardIcon } from './Icons';

interface MediumSelectorProps {
  selectedMedium: MarketingMedium;
  onSelect: (medium: MarketingMedium) => void;
}

const mediums: { name: MarketingMedium; icon: React.ElementType }[] = [
  { name: 'T-Shirt', icon: TshirtIcon },
  { name: 'Mug', icon: MugIcon },
  { name: 'Billboard', icon: BillboardIcon },
];

const MediumSelector: React.FC<MediumSelectorProps> = ({ selectedMedium, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {mediums.map(({ name, icon: Icon }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
            selectedMedium === name
              ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 mb-1.5" />
          <span className="text-xs sm:text-sm font-medium">{name}</span>
        </button>
      ))}
    </div>
  );
};

export default MediumSelector;
