import { useState } from 'react';
// GeminiProvider はそのまま、useGemini は {} で囲んでインポートします
import GeminiProvider, { useGemini } from '../components/api';

// 中身のコンポーネント（現状のGeminiDemo）
function GeminiDemo() {
  const { generateChatResponse } = useGemini();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input) return;
    setLoading(true);
    try {
      // APIを呼び出して結果を受け取る
      const result = await generateChatResponse(input);
      setResponse(result);
    } catch (error) {
      setResponse("エラーが発生しました。コンソールを確認してください。");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Gemini API テスト画面</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AIに話しかけてみてください"
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button 
          onClick={handleSend} 
          disabled={loading}
          style={{ padding: '8px 16px' }}
        >
          {loading ? "送信中..." : "送信する"}
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
        {response || "ここにAIの返答が表示されます"}
      </div>
    </div>
  );
}

// 外側から呼ぶときは、Providerで囲んだものをエクスポートする
export default function TestPage() {
  return (
    <GeminiProvider>
      <GeminiDemo />
    </GeminiProvider>
  );
}