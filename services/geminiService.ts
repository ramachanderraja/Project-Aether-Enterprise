
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFinancialInsight = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text || "I was unable to generate an insight at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error connecting to the Intelligent Core. Please check your API key.";
  }
};

export const analyzeScenario = async (scenarioData: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following scenario simulation results: ${scenarioData}. 
      Provide specific strategic recommendations split into two categories: "Mitigation Strategies" and "Growth Opportunities".
      
      IMPORTANT: You must return the response as a strict JSON object with exactly two keys: 
      1. "mitigation" (an array of strings)
      2. "growth" (an array of strings)
      
      Do not include any markdown formatting, backticks, or extra text. Just the raw JSON string.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      },
    });
    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return JSON.stringify({ mitigation: ["Analysis failed."], growth: ["Analysis failed."] });
  }
};

export const generateRootCauseNarrative = async (anomalyDescription: string, driver: string, context?: string): Promise<string> => {
  try {
    const prompt = `Perform a root cause analysis for the following financial anomaly: "${anomalyDescription}". 
    Primary Driver: ${driver}.
    ${context ? `Additional Context/Likely Cause: ${context}` : ''}
    
    Explain the business context, potential impact, and recommend a corrective action. Keep it under 100 words.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    return "Could not generate root cause narrative.";
  }
};

export const generateActionPlan = async (anomaly: string, driver: string, magnitude: number): Promise<string> => {
  try {
    const prompt = `Create a specific, step-by-step executive action plan to address the following financial anomaly:
    Anomaly: ${anomaly}
    Primary Driver: ${driver}
    Financial Impact: ${magnitude < 0 ? '-' : '+'}$${Math.abs(magnitude)}
    
    The plan should be concise (bullet points), actionable, and assigned to specific departments (e.g., Sales, Engineering, Finance).`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Unable to generate action plan.";
  } catch (error) {
    return "Error generating action plan.";
  }
};
