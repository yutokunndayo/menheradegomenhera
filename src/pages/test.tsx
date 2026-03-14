// src/pages/GeminiDemo.tsx

import React, { useState } from 'react';
import { useGemini } from '../components/api'; // パスは適宜変更してください

const GeminiDemo: React.FC = () => {
  const { generateChatResponse } = useGemini();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await generateChatResponse(prompt);
      setResponse(result);
    } catch (e) {
      setError('エラーが発生しました。APIキーやネットワークを確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">🤖 Gemini 動作確認</h1>

      <textarea
        className="border rounded-xl p-3 w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="プロンプトを入力してください..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-medium rounded-xl px-4 py-2 transition disabled:opacity-50"
        onClick={handleSubmit}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? '送信中...' : '送信'}
      </button>

      {/* 結果表示 */}
      {response && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 whitespace-pre-wrap text-gray-800">
          <p className="text-xs text-green-600 font-semibold mb-1">✅ レスポンス</p>
          {response}
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="text-xs font-semibold mb-1">❌ エラー</p>
          {error}
        </div>
      )}
    </div>
  );
};

export default GeminiDemo;
