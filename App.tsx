
import React, { useState, useCallback } from 'react';
import type { MarketingMedium } from './types';
import { generateVisualization, editImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import MediumSelector from './components/MediumSelector';
import ResultDisplay from './components/ResultDisplay';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<MarketingMedium>('T-Shirt');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (file: File) => {
    setOriginalImage(file);
    setGeneratedImage(null);
    setEditedImage(null);
    setError(null);
    const base64 = await fileToBase64(file);
    setOriginalImageBase64(base64);
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImageBase64 || !originalImage || !selectedMedium) {
      setError('Please upload an image and select a medium first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setEditedImage(null);

    try {
      const base64Data = originalImageBase64.split(',')[1];
      const result = await generateVisualization(base64Data, originalImage.type, selectedMedium);
      setGeneratedImage(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during visualization.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImageBase64, originalImage, selectedMedium]);

  const handleEdit = useCallback(async () => {
    const imageToEdit = generatedImage;
    if (!imageToEdit || !editPrompt) {
      setError('Please generate an image and enter an edit prompt first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = imageToEdit.split(',')[1];
      const result = await editImage(base64Data, 'image/png', editPrompt);
      setEditedImage(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during editing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, editPrompt]);

  const displayImage = editedImage || generatedImage;

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center space-x-3 mb-8">
          <LogoIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Product Visualizer</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Bring your product ideas to life in seconds.</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Upload Product Image</h2>
                <ImageUploader onImageSelect={handleImageUpload} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Choose Medium</h2>
                <MediumSelector selectedMedium={selectedMedium} onSelect={setSelectedMedium} />
              </div>
               <button
                onClick={handleGenerate}
                disabled={!originalImage || isLoading}
                className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isLoading && !displayImage ? 'Visualizing...' : 'Visualize Product'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <ResultDisplay
              imageSrc={displayImage}
              isLoading={isLoading}
              error={error}
              editPrompt={editPrompt}
              onEditPromptChange={setEditPrompt}
              onEditSubmit={handleEdit}
              hasGeneratedImage={!!generatedImage}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
