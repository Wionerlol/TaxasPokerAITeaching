
import React from 'react';
import { Card as CardType } from '../types';
import { SUIT_SYMBOLS, SUIT_FA_ICONS, SUIT_COLORS } from '../constants';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ card, hidden, className = "" }) => {
  // 背面样式优化
  if (hidden) {
    return (
      <div className={`w-16 h-24 md:w-20 md:h-28 bg-blue-900 rounded-xl border-4 border-white flex items-center justify-center card-shadow relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_#ffffff_1px,_transparent_1px)] bg-[size:10px_10px]"></div>
        <div className="w-10 h-14 md:w-12 md:h-16 border-2 border-white/30 rounded-lg flex items-center justify-center">
          <i className="fa-solid fa-spade text-white/50 text-2xl"></i>
        </div>
      </div>
    );
  }

  if (!card) return null;
  const colorClass = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  const faIcon = SUIT_FA_ICONS[card.suit];

  return (
    <div className={`w-16 h-24 md:w-20 md:h-28 bg-white rounded-xl border-2 border-slate-200 flex flex-col p-1 md:p-1.5 card-shadow transition-all hover:shadow-xl relative select-none ${className}`}>
      {/* 左上角数值与花色 */}
      <div className={`absolute top-0.5 left-1 md:top-1 md:left-1.5 flex flex-col items-center leading-none ${colorClass} z-10`}>
        <span className="text-sm md:text-lg font-black tracking-tighter">
          {card.rank}
        </span>
        <span className="text-[10px] md:text-sm mt-0.5">
          {symbol}
        </span>
      </div>
      
      {/* 中央大花色图标 - 减小尺寸并设置低透明度背景以防干扰 */}
      <div className={`flex-1 flex items-center justify-center ${colorClass} opacity-80 mt-2`}>
        <i className={`${faIcon} text-2xl md:text-4xl`}></i>
      </div>
      
      {/* 右下角倒转数值与花色 */}
      <div className={`absolute bottom-0.5 right-1 md:bottom-1 md:right-1.5 flex flex-col items-center rotate-180 leading-none ${colorClass} z-10`}>
        <span className="text-sm md:text-lg font-black tracking-tighter">
          {card.rank}
        </span>
        <span className="text-[10px] md:text-sm mt-0.5">
          {symbol}
        </span>
      </div>
    </div>
  );
};
