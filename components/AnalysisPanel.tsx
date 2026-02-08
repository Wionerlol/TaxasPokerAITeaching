
import React from 'react';

interface AnalysisPanelProps {
  analysis: string;
  onClose: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis = "", onClose }) => {
  const safeAnalysis = analysis || "复盘内容生成中或生成失败，请检查网络环境。";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <i className="fas fa-robot"></i> 牌局复盘与教练点评
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-8 overflow-y-auto prose prose-invert prose-amber max-w-none text-slate-300 leading-relaxed custom-scrollbar">
          {safeAnalysis.split('\n').map((line, i) => (
            <div key={i} className="mb-4">
              {line.startsWith('###') ? (
                <span className="text-2xl font-black text-amber-500 block mt-4 mb-2">{line.replace(/^#+\s/, '')}</span>
              ) : line.startsWith('##') ? (
                <span className="text-xl font-bold text-white block mt-6 mb-2">{line.replace(/^#+\s/, '')}</span>
              ) : line.startsWith('#') ? (
                <span className="text-2xl font-extrabold text-white block mt-6 mb-2">{line.replace(/^#+\s/, '')}</span>
              ) : line.startsWith('-') || line.startsWith('*') ? (
                <li className="ml-4 list-disc marker:text-amber-500">{line.substring(1).trim()}</li>
              ) : (
                <p>{line}</p>
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <button 
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            返回对局
          </button>
        </div>
      </div>
    </div>
  );
};
