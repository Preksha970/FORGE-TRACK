import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = new GoogleGenerativeAI(apiKey);

export async function processCSVWithAI(headers, dataSample) {
  // To be implemented in Phase 4
  console.log('AI processing stub', headers, dataSample);
  return null;
}
