
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
    return response.text || "Join my ride through God's Own Country! Sharing the costs and enjoying the scenic route together.";
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
    const text = response.text;
    return text ? JSON.parse(text) : ["Keep an umbrella ready for sudden showers", "Watch out for KSRTC bus timings", "Enjoy a tea break at a local 'Chaya Kada'"];
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
    const text = response.text || "";
    const price = parseFloat(text.replace(/[^0-9.]/g, ''));
    return isNaN(price) ? 150 : price;
  } catch (error) {
    return 150;
  }
};

/**
 * AI Live Copilot: Provides real-time context and updates for the trip in Kerala
 */
export const getLiveCopilotUpdate = async (from: string, to: string, progress: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a Live Ride Copilot for a pooling app in Kerala, India. The ride is from ${from} to ${to}. The current progress is ${progress}%. 
      Provide a 1-sentence helpful live update. Mention specific Kerala landmarks, local traffic context (like NH66 construction), and a witty local observation.`,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.9,
      }
    });
    return {
      text: response.text || "Cruising through God's Own Country. The lush greenery makes every mile worth it!",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { 
      text: "Cruising through God's Own Country. The lush greenery makes every mile worth it!",
      grounding: []
    };
  }
};

/**
 * Fetches estimated travel time and distance between two locations in Kerala.
 */
export const getTripStats = async (from: string, to: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Calculate the estimated travel duration and distance for a vehicle trip from ${from} to ${to} in Kerala, India. 
      Format your response as a valid JSON object with keys 'duration' and 'distance'.
      Example: {"duration": "2h 30m", "distance": "120 km"}`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });
    
    const text = response.text;
    if (!text) {
      console.warn("Gemini returned no text for trip stats. Falling back.");
      return { duration: "2h approx", distance: "60 km approx" };
    }

    // Extract JSON from potential markdown text or raw string
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.duration && parsed.distance) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse extracted JSON content:", e);
      }
    }
    
    // If we reach here, either text was invalid or parsing failed.
    throw new Error("No valid JSON found in response text");
  } catch (error) {
    console.error("Error fetching trip stats:", error);
    return { duration: "Calculating...", distance: "Calculating..." };
  }
};
