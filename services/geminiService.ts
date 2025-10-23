
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash-image';

const generateContentWithImage = async (parts: any[]) => {
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && firstPart.inlineData) {
    return firstPart.inlineData.data;
  }
  
  const textResponse = response.text;
  if(textResponse) {
    throw new Error(`API returned text instead of an image: ${textResponse}`);
  }

  throw new Error("No image data found in the API response.");
};

export const generateVisualization = async (
  productImageBase64: string,
  productImageMimeType: string,
  medium: string
): Promise<string> => {
  const prompt = `Create a high-quality, professional marketing photo of a white ${medium.toLowerCase()} featuring the provided product image prominently and clearly on it. The background should be clean, minimalist, and complementary to the product. The lighting should be bright and professional.`;

  const parts = [
    { text: prompt },
    {
      inlineData: {
        data: productImageBase64,
        mimeType: productImageMimeType,
      },
    },
  ];

  return generateContentWithImage(parts);
};

export const editImage = async (
  imageBase64: string,
  imageMimeType: string,
  prompt: string
): Promise<string> => {
  const parts = [
    {
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    },
    { text: prompt },
  ];

  return generateContentWithImage(parts);
};
