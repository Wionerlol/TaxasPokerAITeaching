
import React from 'react';
import { GameState, Player } from '../types';
import { Card } from './Card';
import { evaluateHand } from '../services/pokerUtils';

interface PokerTableProps {
  state: GameState;
}

export const PokerTable: React.FC<PokerTableProps> = ({ state }) => {
  const isShort = state.gameMode === 'SHORT';
  
  const getProbColor = (prob: number) => {
    if (prob > 70) return 'text-green-400';
    if (prob > 40) return 'text-amber-400';
    return 'text-red-400';
  };

  // 根据玩家数量计算位置 - 支持2-8人桌
  const getPlayerPositions = () => {
    const playerCount = state.players.length;
    
    // 固定6人及以下的位置
    const positions6 = [
      { top: '85%', left: '50%' },  // 0 - 下
      { top: '65%', left: '12%' },  // 1 - 左下
      { top: '30%', left: '12%' },  // 2 - 左上
      { top: '15%', left: '50%' },  // 3 - 上
      { top: '30%', left: '88%' },  // 4 - 右上
      { top: '65%', left: '88%' },  // 5 - 右下
    ];

    // 7-8人用圆形排列
    if (playerCount === 7) {
      return [
        { top: '85%', left: '50%' },   // 0 - 下
        { top: '72%', left: '18%' },   // 1 - 左下偏下
        { top: '40%', left: '8%' },    // 2 - 左中
        { top: '15%', left: '25%' },   // 3 - 左上
        { top: '10%', left: '50%' },   // 4 - 上
        { top: '15%', left: '75%' },   // 5 - 右上
        { top: '40%', left: '92%' },   // 6 - 右中
      ];
    }
    
    if (playerCount === 8) {
      return [
        { top: '80%', left: '50%' },   // 0 - 下
        { top: '68%', left: '18%' },   // 1 - 左下
        { top: '35%', left: '5%' },    // 2 - 左中
        { top: '12%', left: '25%' },   // 3 - 左上
        { top: '8%', left: '50%' },    // 4 - 上
        { top: '12%', left: '75%' },   // 5 - 右上
        { top: '35%', left: '95%' },   // 6 - 右中
        { top: '68%', left: '82%' },   // 7 - 右下
      ];
    }

    return positions6;
  };

  const positions = getPlayerPositions();

  return (
    <div className={`relative w-full flex-1 min-h-[500px] rounded-[4rem] border-[16px] border-amber-900/50 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-visible transition-colors duration-1000 ${
      isShort ? 'poker-table' : 'bg-[radial-gradient(circle,_#7f1d1d_0%,_#450a0a_100%)]'
    }`}>
      
      {/* 游戏阶段与模式标识 */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className={`px-4 py-1 rounded-full border text-[10px] font-black tracking-[0.2em] uppercase ${
          isShort ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {isShort ? 'Elite 6+ Deck' : 'Classic Standard Deck'}
        </div>
        <div className="text-white/20 text-[9px] font-bold tracking-[0.4em] uppercase">
          {state.allInShowdown ? 'ALL-IN RUNOUT' : `Phase: ${state.phase}`}
        </div>
      </div>

      {/* 公共牌区域 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl mb-6 border border-white/10 shadow-2xl">
          <div className="text-white/40 text-[10px] font-black tracking-widest uppercase text-center">TOTAL POT</div>
          <div className="text-amber-400 font-black text-3xl tabular-nums">${state.pot}</div>
        </div>
        
        <div className="flex gap-2 md:gap-3">
          {state.communityCards.map((c, i) => (
            <Card key={i} card={c} className="shadow-2xl scale-110" />
          ))}
          {[...Array(5 - state.communityCards.length)].map((_, i) => (
            <div key={i} className="w-14 h-20 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center bg-black/5">
               <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
            </div>
          ))}
        </div>
        
        
        {state.communityCards.length >= 3 && state.players[0].holeCards.length === 2 && state.phase !== 'SHOWDOWN' && (
          <div className="mt-6 bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full text-[10px] font-black border border-amber-600/30 uppercase tracking-widest text-center">
            <div className="text-[9px] text-amber-500/80 mb-1">你的最大牌型</div>
            <div className="text-sm">{evaluateHand([...state.players[0].holeCards, ...state.communityCards], state.gameMode).name}</div>
          </div>
        )}
      </div>

      {/* 玩家列表 */}
      {state.players.map((player, i) => {
        const pos = positions[i];
        const isActive = state.currentPlayerIndex === i && state.phase !== 'SHOWDOWN' && !state.allInShowdown;
        const isWinner = state.phase === 'SHOWDOWN' && player.lastAction === 'WINNER!';
        const isDealer = state.dealerIndex === i;
        
        // 关键修复：如果是全下后的跑牌(allInShowdown)或最终结算(SHOWDOWN)，则显示所有底牌
        const isHidden = player.type === 'ai' && state.phase !== 'SHOWDOWN' && !state.allInShowdown;
        
        // 计算玩家的最大牌型
        const playerHandEval = !player.isFolded && player.holeCards.length === 2 && state.communityCards.length >= 3 
          ? evaluateHand([...player.holeCards, ...state.communityCards], state.gameMode)
          : null;

        return (
          <div 
            key={player.id} 
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className={`relative group ${player.isFolded ? 'opacity-30 grayscale' : 'opacity-100'}`}>
              
              {isDealer && (
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-[10px] border-2 border-slate-300 shadow-lg z-30">D</div>
              )}

              {isActive && <div className="absolute -inset-1 rounded-2xl bg-amber-500 animate-pulse opacity-40"></div>}
              {isWinner && <div className="absolute -inset-2 rounded-3xl bg-amber-400 animate-pulse opacity-20 ring-4 ring-amber-400"></div>}

              <div className={`w-28 md:w-40 bg-slate-900/90 backdrop-blur-xl border-2 rounded-2xl overflow-hidden shadow-2xl transition-all
                ${isActive ? 'border-amber-400 scale-105 shadow-amber-500/20' : isWinner ? 'border-amber-400 scale-110 shadow-amber-500/40' : 'border-slate-800'}`}>
                
                <div className={`px-2 md:px-3 py-1.5 md:py-2 border-b border-slate-800 flex justify-between items-center ${isWinner ? 'bg-amber-400/20' : ''}`}>
                  <span className="text-[9px] md:text-[10px] font-bold text-white truncate max-w-[65%]">{player.name}</span>
                  {(player.type === 'human' || state.allInShowdown || state.phase === 'SHOWDOWN') && !player.isFolded && (
                    <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                       {player.isAllIn ? 'All-In' : ''}
                    </span>
                  )}
                </div>

                <div className="p-1.5 md:p-2 flex gap-1 justify-center bg-black/20">
                   {player.holeCards.map((c, idx) => (
                     <Card key={idx} card={c} hidden={isHidden} className="!w-10 !h-14 md:!w-14 md:!h-20 text-[8px] rounded-lg" />
                   ))}
                </div>

                {state.phase === 'SHOWDOWN' && playerHandEval && !player.isFolded && (
                  <div className="px-2 md:px-3 py-1.5 md:py-2 bg-green-900/30 border-t border-green-700/30 flex flex-col items-center">
                    <div className="text-[8px] md:text-[9px] text-green-400 font-bold uppercase tracking-tighter mb-0.5">最大牌型</div>
                    <div className="text-[9px] md:text-[10px] text-green-300 font-black">{playerHandEval.name}</div>
                  </div>
                )}

                <div className="px-2 md:px-3 py-1.5 md:py-2 bg-slate-800/50 flex flex-col items-center">
                   <div className="text-amber-500 font-black text-xs md:text-sm tabular-nums">${player.chips}</div>
                   {player.currentBet > 0 && state.phase !== 'SHOWDOWN' && !state.allInShowdown && (
                     <div className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">BET: ${player.currentBet}</div>
                   )}
                </div>
              </div>

              {player.lastAction && (
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border animate-bounce z-20 ${
                  isWinner ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-white text-slate-950'
                }`}>
                  {player.lastAction}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
