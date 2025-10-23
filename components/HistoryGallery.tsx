
import React from 'react';
import { TrashIcon } from './Icons';

interface HistoryGalleryProps {
  images: string[];
  onSelectImage: (image: string) => void;
  onClearHistory: () => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ images, onSelectImage, onClearHistory }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">History</h3>
        <button
          onClick={onClearHistory}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          aria-label="Clear history"
        >
          <TrashIcon className="w-4 h-4 mr-1.5" />
          Clear History
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((imgSrc, index) => (
          <button
            key={index}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary"
            onClick={() => onSelectImage(imgSrc)}
            aria-label={`Load history item ${index + 1}`}
          >
            <img src={imgSrc} alt={`History item ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-semibold text-sm">Select</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;
