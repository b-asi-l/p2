
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTripDescription = async (from: string, to: string, vehicle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a friendly and catchy 2-sentence description for a pooling trip from ${from} to ${to} using a ${vehicle}. Focus on being helpful and eco-conscious.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Join my ride! Sharing the costs and saving the environment one trip at a time.";
  }
};

export const getRideAdvice = async (from: string, to: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 3 quick tips or advice for people traveling from ${from} to ${to}. Mention traffic potential, best coffee stops, or scenic spots.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return ["Stay hydrated", "Check traffic", "Enjoy the ride"];
  }
};
