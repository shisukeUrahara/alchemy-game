import { GoogleGenAI, Type } from "@google/genai";
import { ElementType } from "../types";

// Helper to sort IDs to ensure consistent cache keys
export const getRecipeKey = (id1: string, id2: string) => {
  return [id1, id2].sort().join('+');
};

export const combineElementsWithAI = async (
  elementA: ElementType,
  elementB: ElementType
): Promise<ElementType | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Act as an Alchemy Game Engine.
      Combine these two elements: "${elementA.name}" and "${elementB.name}".
      
      Rules:
      1. Create a NEW element that logically results from this combination.
      2. It should be a single noun (e.g., "Steam", "Life", "Robot").
      3. Be creative but logical.
      4. If they absolutely cannot combine into something new (very rare), return null.
      
      Output valid JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            name: { type: Type.STRING },
            emoji: { type: Type.STRING },
            color: { type: Type.STRING, description: "Hex color code matching the element" },
            description: { type: Type.STRING, description: "A witty short description" }
          },
          required: ["success", "name", "emoji", "color", "description"]
        }
      }
    });

    if (!response.text) return null;

    const data = JSON.parse(response.text);

    if (!data.success) return null;

    return {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      description: data.description,
      isNew: true
    };

  } catch (error) {
    console.error("Gemini Alchemy Error:", error);
    return null;
  }
};
