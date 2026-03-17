import React, { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import VideoGrid from './components/VideoGrid';
import HistoryLibrary from './components/HistoryLibrary';

const INIT_VIDEOS = [
  { name: 'Seedance', status: '等待中', progress: 0, url: '' },
  { name: 'Kling',    status: '等待中', progress: 0, url: '' },
  { name: 'Sora',     status: '等待中', progress: 0, url: '' },
  { name: 'VeoFast',  status: '等待中', progress: 0, url: '' },
];

function App() {
  const [view, setView] = useState('workbench'); // 'workbench' | 'history'
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '你好！我是美影 IP 助手。请输入你的创作灵感，我会为你优化为具有中国动画学派特征的提示词。' }
  ]);
  const [videos, setVideos] = useState(INIT_VIDEOS);
  const [provider, setProvider] = useState('deepseek');
  const [selectedModels, setSelectedModels] = useState(['Seedance', 'Kling', 'Sora', 'VeoFast']);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('meiying_history') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('meiying_history', JSON.stringify(history));
  }, [history]);

  const handleToggleModel = (name) => {
    setSelectedModels(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleAnalyze = async (userInput) => {
    if (!userInput.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: userInput }]);
    try {
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput, provider }),
      });
      if (!response.ok) throw new Error('后端响应异常');
      const data = await response.json();
      const prompts = data.prompts || (data.prompt ? [data.prompt] : []);
      if (prompts.length > 0) {
        setPrompt(prompts[0]);
        setMessages(prev => [...prev, { role: 'assistant', type: 'options', options: prompts }]);
      }
    } catch (err) {
      const fallback = `水墨写意风：${userInput}，宣纸质感，墨色晕染，缓慢横移镜头，4K高清。`;
      setPrompt(fallback);
      setMessages(prev => [...prev, { role: 'assistant', type: 'options', options: [fallback] }]);
    }
  };

  const doGenerate = async (currentPrompt, models) => {
    if (!currentPrompt.trim()) { alert("右侧输入框没有内容，无法分发！"); return; }
    setVideos(INIT_VIDEOS.map(v =>
      models.includes(v.name)
        ? { ...v, status: '生成中', progress: 10 }
        : { ...v, status: '未选中', progress: 0 }
    ));
    try {
      const response = await fetch('http://localhost:8080/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, models }),
      });
      const results = await response.json();
      const updated = INIT_VIDEOS.map(v => {
        const res = results[v.name];
        return {
          ...v,
          status: res?.status || '已完成',
          progress: res?.status === '已完成' ? 100 : 0,
          url: res?.url || ''
        };
      });
      setVideos(updated);
      // 保存到历史库
      setHistory(prev => [...prev, {
        id: Date.now(),
        prompt: currentPrompt,
        videos: updated.filter(v => v.url),
      }]);
    } catch {
      setVideos(INIT_VIDEOS.map(v => ({ ...v, status: '网络错误', progress: 0 })));
    }
  };

  const handleDistribute = () => doGenerate(prompt, selectedModels);

  const handleRegenerate = (item) => {
    setPrompt(item.prompt);
    setView('workbench');
    doGenerate(item.prompt, selectedModels);
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* 左侧 ChatBox */}
      <div className="w-1/3 border-r border-gray-800 p-4">
        <ChatBox
          onAnalyze={handleAnalyze}
          messages={messages}
          provider={provider}
          onProviderChange={setProvider}
          onSelectPrompt={setPrompt}
        />
      </div>

      {/* 右侧工作区 */}
      <div className="w-2/3 p-5 flex flex-col bg-gray-900">
        {/* Tab 切换 */}
        <div role="tablist" className="tabs tabs-boxed mb-5 self-start bg-gray-800">
          <button role="tab" className={view === 'workbench' ? 'tab tab-active' : 'tab text-gray-400'} onClick={() => setView('workbench')}>工作台</button>
          <button role="tab" className={view === 'history' ? 'tab tab-active' : 'tab text-gray-400'} onClick={() => setView('history')}>
            历史库 {history.length > 0 && <span className="badge badge-primary badge-sm ml-1">{history.length}</span>}
          </button>
        </div>

        {view === 'workbench' ? (
          <>
            <div className="mb-5">
              <textarea
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary resize-none transition-colors"
                rows="4"
                placeholder="输入提示词，或从左侧选择优化结果..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                className="mt-3 px-6 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
                onClick={handleDistribute}
              >
                一键分发（{selectedModels.length} 个模型）
              </button>
            </div>
            <VideoGrid videos={videos} selectedModels={selectedModels} onToggleModel={handleToggleModel} />
          </>
        ) : (
          <HistoryLibrary history={history} onRegenerate={handleRegenerate} />
        )}
      </div>
    </div>
  );
}

export default App;
