import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Testing gemini-3.1-pro-preview");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: 'Hello'
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
