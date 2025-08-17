
import { GoogleGenAI, Type } from "@google/genai";
import type { OrganizationSuggestion } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

// API key is obtained from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      folderName: {
        type: Type.STRING,
        description: 'The suggested name for the new folder.',
      },
      fileNames: {
        type: Type.ARRAY,
        description: 'An array of file names that should be moved into this folder.',
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["folderName", "fileNames"],
  },
};

export async function suggestOrganization(fileNames: string[]): Promise<OrganizationSuggestion[]> {
  if (fileNames.length === 0) {
    return [];
  }

  const prompt = `
    Given the following list of file names, suggest a folder structure to organize them.
    Group related files together into folders. Only include files from the provided list.
    Provide the output as a JSON array of objects, where each object has "folderName" and "fileNames" keys.
    
    Example:
    File list: "report-2023.pdf", "sales-chart.png", "report-2022.pdf", "team-photo.jpg"
    Output:
    [
      { "folderName": "Reports", "fileNames": ["report-2023.pdf", "report-2022.pdf"] },
      { "folderName": "Images", "fileNames": ["sales-chart.png", "team-photo.jpg"] }
    ]

    File list to organize:
    ${fileNames.join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text.trim();
    if (!text) {
        console.warn("Received empty response from Gemini API");
        return [];
    }
    
    const suggestions = JSON.parse(text) as OrganizationSuggestion[];

    // Filter out any empty folder suggestions or suggestions that don't match the input files
    const validFileNames = new Set(fileNames);
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        fileNames: suggestion.fileNames.filter(fileName => validFileNames.has(fileName)),
      }))
      .filter(suggestion => suggestion.fileNames.length > 0);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Attempt to parse Gemini's error message if available
    if (error instanceof Error && error.message.includes('response')) {
      try {
        const errorObj = JSON.parse(error.message.split('response: ')[1]);
        if (errorObj?.error?.message) {
           throw new Error(`Gemini API Error: ${errorObj.error.message}`);
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    throw new Error("Failed to get organization suggestions from Gemini.");
  }
}
