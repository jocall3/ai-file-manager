
import { GoogleGenAI, Type } from "@google/genai";
import type { OrganizationSuggestion } from '../types';
import loggingService from './loggingService';

const MODEL_NAME = 'gemini-2.5-flash';

let ai: GoogleGenAI | null = null;

// Lazily initialize the AI client to prevent app crash on startup if API key is missing.
function getAiClient(): GoogleGenAI {
  if (ai) {
    return ai;
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    // This user-friendly error will be caught by the UI components that call the API
    throw new Error("Gemini API key is not configured. Please see the README.md for setup instructions.");
  }
  
  ai = new GoogleGenAI({ apiKey: API_KEY });
  loggingService.log('GeminiService', 'GoogleGenAI client initialized successfully.');
  return ai;
}

const organizationSchema = {
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
    propertyOrdering: ["folderName", "fileNames"],
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
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: organizationSchema,
      }
    });

    const text = response.text.trim();
    if (!text) {
        loggingService.warn("GeminiService", "Received empty response from Gemini API for organization suggestions.");
        return [];
    }
    
    const suggestions = JSON.parse(text) as OrganizationSuggestion[];

    const validFileNames = new Set(fileNames);
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        fileNames: suggestion.fileNames.filter(fileName => validFileNames.has(fileName)),
      }))
      .filter(suggestion => suggestion.fileNames.length > 0);

  } catch (error) {
    loggingService.error('GeminiService', 'Error calling Gemini API for organization suggestions:', error);
    throw new Error("Failed to get organization suggestions from Gemini.");
  }
}

export async function explainFolder(fileNames: string[]): Promise<string> {
  if (fileNames.length === 0) {
    return "This folder is empty.";
  }
  const prompt = `
    Based on the following list of filenames from a directory, provide a high-level summary of the folder's purpose.
    Describe the likely project type, identify any key files, and explain what the folder contains in a concise, helpful paragraph.
    Use Markdown for formatting if it helps clarity (e.g., lists, bolding).

    Filenames:
    ${fileNames.join('\n')}
  `;

  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text;
  } catch (error) {
    loggingService.error('GeminiService', 'Error calling Gemini API for folder explanation:', error);
    throw new Error("Failed to get folder explanation from Gemini.");
  }
}

export async function generatePreview(fileName: string, fileContent: string): Promise<string> {
    const prompt = `
      Provide a very brief, one-sentence summary of the following file content.
      The file is named "${fileName}". Focus on the main purpose of the file.
      
      Content:
      ---
      ${fileContent.substring(0, 4000)}
      ---
    `;
    try {
      const aiClient = getAiClient();
      const response = await aiClient.models.generateContent({ model: MODEL_NAME, contents: prompt });
      return response.text;
    } catch (error) {
      loggingService.error('GeminiService', `Error calling Gemini API for preview of "${fileName}":`, error);
      throw new Error("Failed to generate preview.");
    }
}


export async function performSemanticSearch(query: string, files: { name: string, content: string }[]): Promise<string[]> {
  const prompt = `
    I am searching for: "${query}".
    From the following list of files, please identify which ones are the most relevant to my search query.
    Consider the file name and its content. Return your answer as a JSON array of filenames. Only return filenames that exist in the provided list.
    
    Example:
    Query: "marketing report"
    Files: [{"name": "sales.txt", "content": "Q1 sales were up."}, {"name": "report-final.txt", "content": "This is the Q2 marketing report..."}]
    Output: ["report-final.txt"]

    Files to search:
    ${JSON.stringify(files.map(f => ({ name: f.name, content: f.content.substring(0, 2000) })))}
  `;

  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
      }
    });

    const text = response.text.trim();
    return JSON.parse(text) as string[];
  } catch (error) {
    loggingService.error('GeminiService', 'Error calling Gemini API for semantic search:', error);
    throw new Error("Semantic search failed.");
  }
}

export async function performContextualAction(action: 'summarize' | 'explain_code', fileContent: string): Promise<string> {
    let prompt = '';
    switch (action) {
        case 'summarize':
            prompt = `Please provide a detailed summary of the following document. Use markdown for formatting, including a title, key points in a bulleted list, and a concluding sentence.
            
            Document Content:
            ---
            ${fileContent}
            ---
            `;
            break;
        case 'explain_code':
            prompt = `Please provide a detailed explanation of the following code snippet. Describe its purpose, how it works, and identify any potential improvements.
            
            Code:
            ---
            ${fileContent}
            ---
            `;
            break;
    }

    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({ model: MODEL_NAME, contents: prompt });
        return response.text;
    } catch (error) {
        loggingService.error('GeminiService', `Error calling Gemini API for action '${action}':`, error);
        throw new Error(`Failed to perform AI action: ${action}.`);
    }
}