import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

const STYLE_LABELS = ['水墨写意风', '现代国潮风', '赛博仙侠风'];

function ChatBox({ onAnalyze, messages = [], provider = 'openai', onProviderChange, onSelectPrompt }) {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // {msgIdx, optIdx}
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAnalyzeClick = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    const input = userInput;
    setUserInput('');
    setSelected(null);
    await onAnalyze(input);
    setLoading(false);
  };

  const handleSelect = (msgIdx, optIdx, text) => {
    setSelected({ msgIdx, optIdx });
    onSelectPrompt(text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl p-4 gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          <h2 className="text-xl font-bold text-gray-100">美影 AI 助手</h2>
        </div>
        <div role="tablist" className="tabs tabs-boxed tabs-sm">
          <button
            role="tab"
            className={provider === 'openai' ? 'tab tab-active' : 'tab'}
            onClick={() => onProviderChange('openai')}
          >
            OpenAI
          </button>
          <button
            role="tab"
            className={provider === 'deepseek' ? 'tab tab-active' : 'tab'}
            onClick={() => onProviderChange('deepseek')}
          >
            DeepSeek
          </button>
        </div>
      </div>

      <div className="flex-grow bg-gray-800 rounded-xl p-4 overflow-y-auto mb-4 border border-gray-700 min-h-[300px]">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === 'options' ? (
              <div className="flex flex-col gap-2 my-2">
                <p className="text-xs text-gray-400 ml-1">选择一个提示词发给视频模型 👇</p>
                {msg.options.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => handleSelect(i, j, opt)}
                    className={`text-left text-sm p-3 rounded-xl border transition-all ${
                      selected?.msgIdx === i && selected?.optIdx === j
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="badge badge-primary badge-sm mr-2">{STYLE_LABELS[j] || `方案${j + 1}`}</span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-accent' : 'chat-bubble-primary'}`}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat chat-start">
            <div className="chat-bubble chat-bubble-primary">正在优化中...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="relative">
        <textarea
          className="textarea w-full pr-12 h-32 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary"
          placeholder="例如：画画的孙悟空..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyzeClick(); } }}
          disabled={loading}
        />
        <button
          className={`btn btn-circle btn-primary absolute right-2 bottom-2 ${loading ? 'loading' : ''}`}
          onClick={handleAnalyzeClick}
          disabled={loading}
        >
          {!loading && <Send size={20} />}
        </button>
      </div>

      <p className="text-xs text-center text-gray-600 mt-2">
        聚焦：水墨、剪纸、木偶及传统色彩风格
      </p>
    </div>
  );
}

export default ChatBox;
