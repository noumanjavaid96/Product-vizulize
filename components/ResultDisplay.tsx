
import React from 'react';
import { SparklesIcon, DownloadIcon, ShareIcon } from './Icons';

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

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'product-visualization.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageSrc || !canShare) return;
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'product-visualization.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My AI Product Visualization',
          text: 'Check out this product mockup I created with the AI Product Visualizer!',
        });
      } else {
        alert("Your browser doesn't support sharing files.");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
        alert('An error occurred while trying to share the image.');
      }
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden flex-grow mb-6">
        <div className="w-full h-full flex items-center justify-center">
          {isLoading && !imageSrc ? ( // Only show loading skeleton on initial load
            <LoadingSkeleton />
          ) : error ? (
            <div className="w-full h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl flex items-center justify-center p-4">
              <p className="text-red-600 dark:text-red-300 text-center font-medium">{error}</p>
            </div>
          ) : imageSrc ? (
            <div className="relative w-full h-full">
              <img src={imageSrc} alt="Generated result" className="object-contain w-full h-full" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                  <SparklesIcon className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              )}
            </div>
          ) : (
            <Placeholder />
          )}
        </div>
      </div>
      
      {hasGeneratedImage && (
        <div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button 
              onClick={handleDownload} 
              className="flex items-center justify-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download
            </button>
            {canShare && (
              <button 
                onClick={handleShare} 
                className="flex items-center justify-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                <ShareIcon className="w-5 h-5 mr-2" />
                Share
              </button>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Edit with a prompt</h3>
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
