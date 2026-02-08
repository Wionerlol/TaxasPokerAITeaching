
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type AiProvider = 'gpt' | 'kimi' | 'deepseek' | 'doubao';
export type GameMode = 'SHORT' | 'LONG';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GamePhase = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
export type BettingAction = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | '3BET' | '4BET' | 'ALLIN';
export type PlayerType = 'human' | 'ai';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  provider?: AiProvider;
  chips: number;
  holeCards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  lastAction: string;
  currentBet: number;
  hasActedThisStreet: boolean;
  proStyle?: string;
}

export interface PlayerAction {
  playerId: string;
  playerName: string;
  action: BettingAction;
  amount: number;
  phase: GamePhase;
}

export interface GameState {
  gameMode: GameMode;
  deck: Card[];
  players: Player[];
  communityCards: Card[];
  pot: number;
  minRaise: number;
  currentBet: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  phase: GamePhase;
  handHistory: PlayerAction[];
  userWinProb: number;
  showAnalysis: boolean;
  analysisText: string;
  allInShowdown?: boolean;
  reviewProvider: AiProvider; // 新增：记录复盘使用的供应商
}

export interface HandHistoryEntry {
  timestamp: number;
  result: string;
  summary: string;
}

export enum HandRank {
  HIGH_CARD,
  ONE_PAIR,
  TWO_PAIR,
  THREE_OF_A_KIND, 
  STRAIGHT,        
  FLUSH,           
  FULL_HOUSE,      
  FOUR_OF_A_KIND,
  STRAIGHT_FLUSH,
  ROYAL_FLUSH
}

export const RANK_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
