
import { Card, Rank, Suit, HandRank, RANK_ORDER, GameMode } from '../types';

export const createDeck = (mode: GameMode): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  // 短牌 6-A (36张), 长牌 2-A (52张)
  const ranks: Rank[] = mode === 'SHORT' 
    ? ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    : ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getRankValue = (rank: Rank): number => RANK_ORDER.indexOf(rank);

export const evaluateHand = (cards: Card[], mode: GameMode = 'LONG'): { rank: HandRank; value: number; name: string } => {
  if (cards.length < 5) return { rank: HandRank.HIGH_CARD, value: 0, name: '高牌' };
  const combinations = getCombinations(cards, 5);
  let bestHand = { rank: HandRank.HIGH_CARD, value: 0, name: '高牌' };
  
  for (const combo of combinations) {
    const evalResult = evaluateFiveCards(combo, mode);
    if (evalResult.rank > bestHand.rank || (evalResult.rank === bestHand.rank && evalResult.value > bestHand.value)) {
      bestHand = evalResult;
    }
  }
  return bestHand;
};

function getCombinations<T>(array: T[], k: number): T[][] {
  const results: T[][] = [];
  function backtrack(start: number, path: T[]) {
    if (path.length === k) { results.push([...path]); return; }
    for (let i = start; i < array.length; i++) {
      path.push(array[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return results;
}

function evaluateFiveCards(cards: Card[], mode: GameMode) {
  const ranks = cards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const rankCounts: Record<number, number> = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  const isFlush = new Set(suits).size === 1;
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
  
  let isStraight = false;
  // 标准顺子判定
  if (uniqueRanks.length === 5 && uniqueRanks[0] - uniqueRanks[4] === 4) {
    isStraight = true;
  }
  // 特殊顺子判定 (A-低位)
  if (uniqueRanks.length === 5) {
    if (mode === 'SHORT') {
      // 6+ A-6-7-8-9
      if (uniqueRanks.includes(12) && uniqueRanks.includes(4) && uniqueRanks.includes(5) && uniqueRanks.includes(6) && uniqueRanks.includes(7)) isStraight = true;
    } else {
      // 长牌 A-2-3-4-5
      if (uniqueRanks.includes(12) && uniqueRanks.includes(0) && uniqueRanks.includes(1) && uniqueRanks.includes(2) && uniqueRanks.includes(3)) isStraight = true;
    }
  }

  // 1. 同花顺/皇家同花顺
  if (isStraight && isFlush) {
    if (ranks[0] === 12 && ranks[1] === 11) return { rank: HandRank.ROYAL_FLUSH, value: calculateValue(ranks), name: '皇家同花顺' };
    return { rank: HandRank.STRAIGHT_FLUSH, value: calculateValue(ranks), name: '同花顺' };
  }

  // 2. 四条
  if (counts[0] === 4) return { rank: HandRank.FOUR_OF_A_KIND, value: calculateValue(ranks, rankCounts), name: '四条' };

  // 规则差异化分支
  if (mode === 'SHORT') {
    // 短牌: 同花 > 葫芦, 三条 > 顺子
    if (isFlush) return { rank: HandRank.FLUSH, value: calculateValue(ranks), name: '同花' };
    if (counts[0] === 3 && counts[1] === 2) return { rank: HandRank.FULL_HOUSE, value: calculateValue(ranks, rankCounts), name: '葫芦' };
    if (counts[0] === 3) return { rank: HandRank.THREE_OF_A_KIND, value: calculateValue(ranks, rankCounts), name: '三条' };
    if (isStraight) return { rank: HandRank.STRAIGHT, value: calculateValue(ranks), name: '顺子' };
  } else {
    // 长牌: 葫芦 > 同花, 顺子 > 三条
    if (counts[0] === 3 && counts[1] === 2) return { rank: HandRank.FULL_HOUSE, value: calculateValue(ranks, rankCounts), name: '葫芦' };
    if (isFlush) return { rank: HandRank.FLUSH, value: calculateValue(ranks), name: '同花' };
    if (isStraight) return { rank: HandRank.STRAIGHT, value: calculateValue(ranks), name: '顺子' };
    if (counts[0] === 3) return { rank: HandRank.THREE_OF_A_KIND, value: calculateValue(ranks, rankCounts), name: '三条' };
  }

  if (counts[0] === 2 && counts[1] === 2) return { rank: HandRank.TWO_PAIR, value: calculateValue(ranks, rankCounts), name: '两对' };
  if (counts[0] === 2) return { rank: HandRank.ONE_PAIR, value: calculateValue(ranks, rankCounts), name: '一对' };
  return { rank: HandRank.HIGH_CARD, value: calculateValue(ranks), name: '高牌' };
}

function calculateValue(sortedRanks: number[], counts?: Record<number, number>): number {
  if (!counts) return sortedRanks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
  const grouped = Object.entries(counts).map(([r, c]) => ({ r: parseInt(r), c })).sort((a, b) => b.c === a.c ? b.r - a.r : b.c - a.c);
  let val = 0;
  grouped.forEach((g, i) => { val += g.r * Math.pow(15, 4 - i); });
  return val;
}

export const calculateWinProbability = (
  userHand: Card[],
  communityCards: Card[],
  activeOpponentsCount: number,
  mode: GameMode,
  iterations: number = 200
): number => {
  if (userHand.length < 2) return 0;
  const fullDeck = createDeck(mode);
  const knownCards = [...userHand, ...communityCards];
  const remainingDeck = fullDeck.filter(dc => !knownCards.some(kc => kc.rank === dc.rank && kc.suit === dc.suit));
  
  let userWins = 0;
  for (let i = 0; i < iterations; i++) {
    const simDeck = shuffle(remainingDeck);
    let deckIdx = 0;
    const simCommunity = [...communityCards];
    while (simCommunity.length < 5) simCommunity.push(simDeck[deckIdx++]);
    
    const userEval = evaluateHand([...userHand, ...simCommunity], mode);
    let beatAll = true;
    for (let j = 0; j < activeOpponentsCount; j++) {
      const oppHand = [simDeck[deckIdx++], simDeck[deckIdx++]];
      const oppEval = evaluateHand([...oppHand, ...simCommunity], mode);
      if (oppEval.rank > userEval.rank || (oppEval.rank === userEval.rank && oppEval.value > userEval.value)) {
        beatAll = false;
        break;
      }
    }
    if (beatAll) userWins++;
  }
  return (userWins / iterations) * 100;
};
