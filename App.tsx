import React, { useState, useCallback, useEffect } from 'react';
import { generateVisualization, editImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import HistoryGallery from './components/HistoryGallery';
import MediumSelector from './components/MediumSelector';
import ConversationalAgent from './components/ConversationalAgent';
import { LogoIcon, RefreshIcon, MicrophoneIcon } from './components/Icons';
import type { MarketingMedium } from './types';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<MarketingMedium>('T-Shirt');
  const [keywords, setKeywords] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [resetCounter, setResetCounter] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('visualizationHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (history.length > 0) {
        localStorage.setItem('visualizationHistory', JSON.stringify(history));
      } else {
        localStorage.removeItem('visualizationHistory');
      }
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

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
    if (!originalImageBase64 || !originalImage) {
      setError('Please upload a design first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setEditedImage(null);

    try {
      const base64Data = originalImageBase64.split(',')[1];
      const result = await generateVisualization(base64Data, originalImage.type, selectedMedium, keywords);
      const imageUrl = `data:image/png;base64,${result}`;
      setGeneratedImage(imageUrl);
      setHistory(prev => [imageUrl, ...prev.filter(item => item !== imageUrl)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during visualization.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImageBase64, originalImage, keywords, selectedMedium]);

  const handleEdit = useCallback(async () => {
    const imageToEdit = editedImage || generatedImage;
    if (!imageToEdit || !editPrompt) {
      setError('Please generate an image and enter an edit prompt first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Data = imageToEdit.split(',')[1];
      const result = await editImage(base64Data, 'image/png', editPrompt);
      const imageUrl = `data:image/png;base64,${result}`;
      setEditedImage(imageUrl);
      setHistory(prev => [imageUrl, ...prev.filter(item => item !== imageUrl)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during editing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, editedImage, editPrompt]);

  const handleHistorySelect = (image: string) => {
    setGeneratedImage(image);
    setEditedImage(null);
    setEditPrompt('');
    setError(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire visualization history? This cannot be undone.')) {
      setHistory([]);
    }
  };

  const handleStartNew = () => {
    setOriginalImage(null);
    setOriginalImageBase64(null);
    setKeywords('');
    setGeneratedImage(null);
    setEditedImage(null);
    setEditPrompt('');
    setError(null);
    setResetCounter(c => c + 1);
  };

  const displayImage = editedImage || generatedImage;

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center space-x-3 mb-8">
          <LogoIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Product Visualizer</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Create stunning marketing mockups in seconds.</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Upload Design</h2>
                    <button
                        onClick={handleStartNew}
                        className="text-sm font-medium text-primary hover:text-primary-focus dark:hover:text-blue-400 flex items-center transition-colors"
                        title="Start a new session"
                    >
                        <RefreshIcon className="w-4 h-4 mr-1.5" />
                        Start New
                    </button>
                </div>
                <ImageUploader key={resetCounter} onImageSelect={handleImageUpload} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Choose Medium</h2>
                <MediumSelector selectedMedium={selectedMedium} onSelect={setSelectedMedium} />
              </div>
               <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  3. Style Keywords <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
                </h2>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., on a person, flat lay, urban"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
               <button
                onClick={handleGenerate}
                disabled={!originalImage || isLoading}
                className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isLoading && !displayImage ? `Visualizing on ${selectedMedium}...` : `Visualize on ${selectedMedium}`}
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
            <HistoryGallery
              images={history}
              onSelectImage={handleHistorySelect}
              onClearHistory={handleClearHistory}
            />
          </div>
        </main>
      </div>
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-primary hover:bg-primary-focus text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out z-50 transform hover:scale-110"
        aria-label="Open AI assistant"
      >
        <MicrophoneIcon className="h-7 w-7" />
      </button>

      {isChatOpen && <ConversationalAgent onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default App;