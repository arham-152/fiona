import { GoogleGenAI, Type } from "@google/genai";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
};

export interface SmartAnalysisResult {
  rotation: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isDocument: boolean;
  documentType?: string;
}

const aiCache = new Map<string, SmartAnalysisResult>();

export async function analyzeImageForSmartCrop(base64Data: string): Promise<SmartAnalysisResult> {
  const ai = getAi();
  const model = "gemini-3-flash-preview";

  // Cache check
  const cacheKey = base64Data.substring(0, 100) + base64Data.length;
  if (aiCache.has(cacheKey)) return aiCache.get(cacheKey)!;

  // Remove data:image/jpeg;base64, prefix if present
  const cleanBase64 = base64Data.split(',')[1] || base64Data;

  const prompt = `
    Analyze this image which contains one or more documents (like ID cards, passports, or receipts) on a background.
    1. Identify the main document(s) in the image.
    2. Determine the correct orientation (0, 90, 180, 270 degrees clockwise) so the document text is upright and readable.
    3. Provide a single bounding box (crop) that encompasses all the important document content, removing as much of the background as possible.
    4. Return the results in JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rotation: { type: Type.NUMBER, description: "Suggested rotation in degrees (0, 90, 180, 270)" },
          isDocument: { type: Type.BOOLEAN },
          documentType: { type: Type.STRING },
          crop: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: "X coordinate of top-left corner (0-1000)" },
              y: { type: Type.NUMBER, description: "Y coordinate of top-left corner (0-1000)" },
              width: { type: Type.NUMBER, description: "Width (0-1000)" },
              height: { type: Type.NUMBER, description: "Height (0-1000)" }
            },
            required: ["x", "y", "width", "height"]
          }
        },
        required: ["rotation", "isDocument"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}") as SmartAnalysisResult;
  aiCache.set(cacheKey, result);
  return result;
}
