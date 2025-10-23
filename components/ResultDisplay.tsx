
import React from 'react';
import { SparklesIcon } from './Icons';

interface ResultDisplayProps {
  imageSrc: string | null;
  isLoading: boolean;
  error: string | null;
  editPrompt: string;
  onEditPromptChange: (prompt: string) => void;
  onEditSubmit: () => void;
  hasGeneratedImage: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse-fast flex items-center justify-center">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <SparklesIcon className="w-16 h-16 mx-auto animate-spin" style={{ animationDuration: '3s' }}/>
      <p className="mt-4 font-semibold">AI is creating magic...</p>
      <p className="text-sm">This may take a moment.</p>
    </div>
  </div>
);

const Placeholder: React.FC = () => (
  <div className="w-full h-full bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex items-center justify-center">
    <div className="text-center text-gray-500 dark:text-gray-400 p-8">
      <SparklesIcon className="w-16 h-16 mx-auto" />
      <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Your visualization will appear here</h3>
      <p className="mt-2">Upload an image, choose a medium, and click "Visualize Product" to get started.</p>
    </div>
  </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  imageSrc,
  isLoading,
  error,
  editPrompt,
  onEditPromptChange,
  onEditSubmit,
  hasGeneratedImage,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEditSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden flex-grow mb-6">
        <div className="w-full h-full flex items-center justify-center">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="w-full h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl flex items-center justify-center p-4">
              <p className="text-red-600 dark:text-red-300 text-center font-medium">{error}</p>
            </div>
          ) : imageSrc ? (
            <img src={imageSrc} alt="Generated result" className="object-contain w-full h-full" />
          ) : (
            <Placeholder />
          )}
        </div>
      </div>
      
      {hasGeneratedImage && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Edit with a prompt</h3>
          <div className="relative">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => onEditPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g., "Add a retro filter" or "Change background to a beach"'
              disabled={isLoading || !hasGeneratedImage}
              className="w-full pl-4 pr-32 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:bg-gray-200 dark:disabled:bg-gray-700"
            />
            <button
              onClick={onEditSubmit}
              disabled={isLoading || !editPrompt || !hasGeneratedImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-focus text-white font-semibold py-2 px-5 rounded-md transition-all duration-300 ease-in-out disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
