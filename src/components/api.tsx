// src/lib/gemini.ts → src/components/GeminiProvider.tsx などに配置想定

import { GoogleGenerativeAI } from '@google/generative-ai';
import React, { createContext, useContext } from 'react';

// --- 型定義 ---
type GeminiContextType = {
  generateChatResponse: (prompt: string) => Promise<string>;
};

// --- Context ---
const GeminiContext = createContext<GeminiContextType | null>(null);

// --- Providerコンポーネント ---
type GeminiProviderProps = {
  children: React.ReactNode;
};

const GeminiProvider: React.FC<GeminiProviderProps> = ({ children }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("エラー: VITE_GEMINI_API_KEY が設定されていません。");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const generateChatResponse = async (prompt: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error('AIの応答に失敗しました');
    }
  };

  return (
    <GeminiContext.Provider value={{ generateChatResponse }}>
      {children}
    </GeminiContext.Provider>
  );
};

// --- カスタムフック ---
export const useGemini = (): GeminiContextType => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini は GeminiProvider の内側で使ってください');
  }
  return context;
};

export default GeminiProvider;