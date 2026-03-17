import React from 'react';

function VideoGrid({ videos, selectedModels, onToggleModel }) {
  return (
    <div className="grid grid-cols-2 gap-4 h-[calc(100vh-220px)] overflow-y-auto pr-1">
      {videos.map((video, index) => {
        const isSelected = selectedModels.includes(video.name);
        return (
          <div key={index} className={`rounded-2xl p-4 flex flex-col transition-all duration-200 ${isSelected ? 'bg-gray-800 border border-gray-700' : 'bg-gray-800/40 border border-gray-800 opacity-50'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={isSelected}
                  onChange={() => onToggleModel(video.name)}
                />
                <span className="font-semibold text-gray-100">{video.name}</span>
              </div>
              <span className={`badge badge-sm ${video.status === '已完成' ? 'badge-success' : video.status === '未选中' ? 'badge-ghost text-gray-500' : 'badge-warning'}`}>
                {video.status}
              </span>
            </div>

            <div className="flex-grow bg-black rounded-xl flex items-center justify-center min-h-[180px] mb-3 overflow-hidden">
              {video.url ? (
                <video src={video.url} controls className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-600 text-sm">
                  {video.status === '生成中' ? `生成中 ${video.progress}%` : video.status === '未选中' ? '— 未选中 —' : '等待中'}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <progress className="progress progress-primary w-full h-1.5" value={video.progress} max="100" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input type="number" placeholder="一致性" className="input input-bordered input-xs bg-gray-900 border-gray-700 text-gray-300 placeholder-gray-600" />
                <input type="number" placeholder="连贯性" className="input input-bordered input-xs bg-gray-900 border-gray-700 text-gray-300 placeholder-gray-600" />
                <input type="number" placeholder="意境感" className="input input-bordered input-xs bg-gray-900 border-gray-700 text-gray-300 placeholder-gray-600" />
                <input type="number" placeholder="水墨感" className="input input-bordered input-xs bg-gray-900 border-gray-700 text-gray-300 placeholder-gray-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VideoGrid;
