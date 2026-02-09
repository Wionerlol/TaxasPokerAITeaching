import React from 'react';
import { leaderboard } from '../services/leaderboard';

export const Leaderboard: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [entries, setEntries] = React.useState(() => leaderboard.getRanking());
  const [rounds, setRounds] = React.useState(() => leaderboard.getRounds());

  React.useEffect(() => {
    setEntries(leaderboard.getRanking());
    setRounds(leaderboard.getRounds());
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md z-60">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-white">排行榜</h3>
          <div className="text-xs text-slate-400">回合: {rounds}/20</div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {entries.map((e, i) => (
            <div key={e.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-700">
              <div>
                <div className="text-xs text-slate-400">#{i + 1} {e.name}</div>
                <div className="text-sm font-black text-white">得分: {e.score >= 0 ? `水上 ${e.score}` : `水下 ${Math.abs(e.score)}`}</div>
              </div>
              <div className="text-xs text-slate-400">筹码: ${e.lastChips}</div>
            </div>
          ))}
          {entries.length === 0 && <div className="text-[11px] text-slate-500 italic">榜单尚未初始化</div>}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => { leaderboard.reset(); setEntries(leaderboard.getRanking()); setRounds(leaderboard.getRounds()); }} className="flex-1 bg-slate-800 text-white py-2 rounded-lg">重置榜单</button>
          <button onClick={onClose} className="flex-1 bg-amber-500 text-slate-900 py-2 rounded-lg">关闭</button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
