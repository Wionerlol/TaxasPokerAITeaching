
import React from 'react';
import { SHORT_HAND_STRENGTH_CHART, LONG_HAND_STRENGTH_CHART } from '../constants';
import { GameMode } from '../types';

interface HandChartProps {
  mode?: GameMode;
}

export const HandChart: React.FC<HandChartProps> = ({ mode = 'SHORT' }) => {
  const isShort = mode === 'SHORT';
  const activeChart = isShort ? SHORT_HAND_STRENGTH_CHART : LONG_HAND_STRENGTH_CHART;

  const getHandStrengthColor = (hand: string, rowIndex: number, isShort: boolean) => {
    if (isShort) {
      // 短牌：简单分类
      const isPremium = hand === 'AA' || hand === 'KK' || hand === 'AKs' || hand === 'QQ';
      return isPremium ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400';
    } else {
      // 长牌：5阶强度
      switch (rowIndex) {
        case 0: return 'bg-red-600/30 border-red-600/50 text-red-300 font-black'; // 超强
        case 1: return 'bg-orange-600/30 border-orange-600/50 text-orange-300 font-bold'; // 强
        case 2: return 'bg-amber-600/30 border-amber-600/50 text-amber-300 font-bold'; // 中强
        case 3: return 'bg-yellow-600/30 border-yellow-600/50 text-yellow-300'; // 中等
        case 4: return 'bg-slate-800 border-slate-700 text-slate-400'; // 弱
        default: return 'bg-slate-800 border-slate-700 text-slate-400';
      }
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-8 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <i className={`fas fa-chart-line ${isShort ? 'text-blue-400' : 'text-red-400'}`}></i>
        {isShort ? '短牌' : '长牌'}起手牌强度参考
      </h3>
      
      {!isShort && (
        <div className="mb-3 text-[9px] font-bold flex gap-2 flex-wrap justify-center">
          <span className="px-2 py-1 rounded bg-red-600/30 border border-red-600/50 text-red-300">1️⃣ 超强</span>
          <span className="px-2 py-1 rounded bg-orange-600/30 border border-orange-600/50 text-orange-300">2️⃣ 强</span>
          <span className="px-2 py-1 rounded bg-amber-600/30 border border-amber-600/50 text-amber-300">3️⃣ 中强</span>
          <span className="px-2 py-1 rounded bg-yellow-600/30 border border-yellow-600/50 text-yellow-300">4️⃣ 中等</span>
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">5️⃣ 弱</span>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {activeChart.map((row, rowIndex) =>
          row.map((hand, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square flex items-center justify-center rounded text-[10px] md:text-xs font-bold border transition-colors ${
                getHandStrengthColor(hand, rowIndex, isShort)
              }`}
            >
              {hand}
            </div>
          ))
        )}
      </div>
      <p className="text-[10px] text-slate-500 mt-4 italic leading-relaxed">
        {isShort ? (
          "* 6+ 提示: 同花 > 葫芦, 三条 > 顺子。大牌的统治力更强。"
        ) : (
          "* 长牌提示: 5阶强度分类。超强手立即加注，强手可加注，中强手位置依赖，中等手谨慎，弱手多数位置弃牌。"
        )}
      </p>
    </div>
  );
};
