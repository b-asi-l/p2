
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTripDescription = async (from: string, to: string, vehicle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a friendly and catchy 2-sentence description for a pooling trip in Kerala from ${from} to ${to} using a ${vehicle}. Mention that it's a great way to enjoy the scenic Kerala roads while saving fuel.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Join my ride through God's Own Country! Sharing the costs and enjoying the scenic route together.";
  }
};

export const getRideAdvice = async (from: string, to: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 3 quick tips or advice for people traveling from ${from} to ${to} in Kerala, India. Mention local traffic bottlenecks (like Vyttila or Technopark gates), monsoon driving tips, or popular bakeries/rest-stops along the way.`,
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
    return ["Keep an umbrella ready for sudden showers", "Watch out for KSRTC bus timings", "Enjoy a tea break at a local 'Chaya Kada'"];
  }
};

export const suggestTripPrice = async (from: string, to: string, vehicleType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a fair cost-sharing price per seat in Indian Rupees (INR) for a trip from ${from} to ${to} in Kerala for a ${vehicleType}. Consider Kerala's fuel prices and typical route distances. Return ONLY the number.`,
    });
    const price = parseFloat(response.text.replace(/[^0-9.]/g, ''));
    return isNaN(price) ? 150 : price;
  } catch (error) {
    return 150;
  }
};

/**
 * AI Live Copilot: Provides real-time context and updates for the trip in Kerala
 * Modified to return grounding metadata as per Gemini API requirements for Maps grounding.
 */
export const getLiveCopilotUpdate = async (from: string, to: string, progress: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a Live Ride Copilot for a pooling app in Kerala, India. The ride is from ${from} to ${to}. The current progress is ${progress}%. 
      Provide a 1-sentence helpful live update. Mention specific Kerala landmarks, local traffic context (like NH66 construction), and a witty local observation.
      Example: "Just crossing the Aroor bridge; backwaters look stunning today, and traffic toward Kochi is surprisingly light!"`,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.9,
      }
    });
    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    return { 
      text: "Cruising through God's Own Country. The lush greenery makes every mile worth it!",
      grounding: []
    };
  }
}
