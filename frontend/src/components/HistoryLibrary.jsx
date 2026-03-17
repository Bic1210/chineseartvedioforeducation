import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';

function HistoryLibrary({ history, onRegenerate }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.prompt);
  };

  const confirmEdit = (item) => {
    onRegenerate({ ...item, prompt: editText });
    setEditingId(null);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <Play size={48} strokeWidth={1} />
        <p>还没有生成过视频，去工作台试试吧</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[calc(100vh-160px)] space-y-6 pr-2">
      {[...history].reverse().map((item) => (
        <div key={item.id} className="border rounded-xl p-4 bg-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">{new Date(item.id).toLocaleString('zh-CN')}</span>
            <span className="badge badge-outline badge-sm">{item.videos.filter(v => v.url).length} 个视频</span>
          </div>

          {/* Prompt 区域 */}
          {editingId === item.id ? (
            <div className="flex gap-2 mb-3">
              <textarea
                className="textarea textarea-bordered flex-grow text-sm"
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <button className="btn btn-primary btn-sm" onClick={() => confirmEdit(item)}>
                  <RefreshCw size={14} /> 重新生成
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>取消</button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-gray-700 mb-3 cursor-pointer hover:bg-white rounded p-2 border border-transparent hover:border-gray-200 transition-all"
              onClick={() => startEdit(item)}
              title="点击编辑并重新生成"
            >
              {item.prompt}
            </p>
          )}

          {/* 视频网格 */}
          <div className="grid grid-cols-2 gap-3">
            {item.videos.filter(v => v.url).map((v, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-black">
                <video src={v.url} controls className="w-full" style={{ maxHeight: 160 }} />
                <div className="px-2 py-1 bg-gray-800 text-white text-xs">{v.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryLibrary;
