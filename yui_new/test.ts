import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import 'dotenv/config';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    console.log("Testing gemini-3.1-pro-preview with thinkingLevel");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: 'Hello',
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
