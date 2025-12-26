
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEMACommentary = async (
  event: 'pop' | 'miss' | 'level_up' | 'game_over' | 'streak',
  data: { score: number; streak?: number; level?: number }
) => {
  try {
    const prompt = `You are EMA (Electronic Multimedia Announcer), a witty and slightly sarcastic AI carnival host. 
    Event: ${event}. 
    Current Score: ${data.score}. 
    Streak: ${data.streak || 0}. 
    Level: ${data.level || 1}.
    Provide a short, punchy, and funny comment (under 12 words) reacting to this. 
    Be encouraging but keep that cool AI persona.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });
    return response.text || "Scanning performance... adequate.";
  } catch (error) {
    return "Nice shot!";
  }
};

export const getAuntieCommentary = async (
  event: 'pop' | 'miss' | 'level_up' | 'game_over' | 'streak',
  data: { score: number; streak?: number; level?: number }
) => {
  try {
    const prompt = `You are "Auntie", a legendary night market stall owner. You are informal, loud, and use a lot of expressive interjections like "Aiyoh", "Wah", "Lao deh", "Alamak", "Steady".
    Event: ${event}. 
    Score: ${data.score}. 
    Streak: ${data.streak || 0}.
    Provide a very short side comment (under 10 words). You alternate between nagging the player to do better and being super impressed. 
    Make it feel like a real bustling night market vibe.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 1.0 }
    });
    return response.text || "Wah, so pro ah!";
  } catch (error) {
    return "Aiyoh, focus lah!";
  }
};
