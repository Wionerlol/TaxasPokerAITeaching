
import React, { useMemo } from 'react';
import { BettingAction } from '../types';

interface ControlsProps {
  onAction: (action: BettingAction, amount: number) => void;
  canCheck: boolean;
  minRaise: number;
  currentBet: number;
  pot: number;
  chips: number;
  disabled: boolean;
  betCount: number; // 当前街的下注/加注次数，用于判断是 3bet 还是 4bet
  winProbability?: number; // 赢牌概率
}

export const Controls: React.FC<ControlsProps> = ({ 
  onAction, canCheck, minRaise, currentBet, pot, chips, disabled, betCount, winProbability = 0
}) => {
  const [raiseAmount, setRaiseAmount] = React.useState(minRaise);

  const getProbColor = (prob: number) => {
    if (prob > 70) return 'text-green-400';
    if (prob > 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProbBgColor = (prob: number) => {
    if (prob > 70) return 'bg-green-500/10 border-green-500/30';
    if (prob > 40) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  React.useEffect(() => {
    setRaiseAmount(Math.max(minRaise, currentBet + 100));
  }, [minRaise, currentBet]);

  // 计算 Pot 尺寸下注: 当前底池 + (跟注额 * 2)
  const potSizeAmount = useMemo(() => {
    const toCall = currentBet;
    const amount = pot + toCall * 2;
    return Math.min(amount, chips);
  }, [pot, currentBet, chips]);

  // 计算 3-Bet / 4-Bet 建议尺寸
  const aggressiveAmount = useMemo(() => {
    if (betCount === 1) return Math.min(currentBet * 3, chips); // 3-bet
    if (betCount >= 2) return Math.min(currentBet * 2.5, chips); // 4-bet+
    return minRaise;
  }, [betCount, currentBet, chips, minRaise]);

  return (
    <div className={`bg-slate-900 border-t border-slate-800 p-4 pb-8 transition-all ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* 赢牌概率显示 */}
        {winProbability > 0 && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${getProbBgColor(winProbability)}`}>
            <i className="fas fa-chart-pie text-lg"></i>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">赢牌期望</div>
              <div className={`text-xl font-black ${getProbColor(winProbability)}`}>{winProbability.toFixed(1)}%</div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <div className="font-bold">蒙特卡洛模拟</div>
              <div>200次迭代</div>
            </div>
          </div>
        )}
        
        {/* 高级动作按钮行 */}
        {!disabled && (
          <div className="flex flex-wrap gap-2 justify-center">
            {betCount === 1 && (
              <button 
                onClick={() => onAction('3BET', aggressiveAmount)}
                className="bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/50 px-4 py-2 rounded-xl text-xs font-black transition-all"
              >
                3-BET (${aggressiveAmount})
              </button>
            )}
            {betCount >= 2 && (
              <button 
                onClick={() => onAction('4BET', aggressiveAmount)}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-4 py-2 rounded-xl text-xs font-black transition-all"
              >
                4-BET+ (${aggressiveAmount})
              </button>
            )}
            <button 
              onClick={() => onAction('RAISE', potSizeAmount)}
              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 px-4 py-2 rounded-xl text-xs font-black transition-all"
            >
              POT (${potSizeAmount})
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* 基础动作 */}
          <div className="flex gap-2">
            <button 
              onClick={() => onAction('FOLD', 0)}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-red-600 text-white font-black py-4 px-8 rounded-2xl transition-all border border-slate-700"
            >
              弃牌
            </button>
            
            {canCheck ? (
              <button 
                onClick={() => onAction('CHECK', 0)}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg"
              >
                让牌 (Check)
              </button>
            ) : (
              <button 
                onClick={() => onAction('CALL', currentBet)}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg flex flex-col items-center justify-center leading-tight"
              >
                <span>跟注 (Call)</span>
                <span className="text-[10px] opacity-80">${currentBet}</span>
              </button>
            )}
          </div>

          {/* 加注滑块 */}
          <div className="flex-1 flex items-center gap-4 bg-slate-800/30 p-2 rounded-2xl border border-slate-800">
            <input 
              type="range" 
              min={minRaise} 
              max={chips} 
              step={50}
              value={Math.min(raiseAmount, chips)}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => onAction('RAISE', Math.min(raiseAmount, chips))}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-4 px-6 rounded-2xl transition-all flex flex-col items-center justify-center leading-tight min-w-[120px]"
              >
                <span>加注至</span>
                <span className="text-xs font-black tabular-nums">${raiseAmount}</span>
              </button>
              <button 
                onClick={() => onAction('ALLIN', chips)}
                className="bg-red-900 hover:bg-red-800 text-white font-black py-4 px-4 rounded-2xl transition-all"
              >
                全下
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
