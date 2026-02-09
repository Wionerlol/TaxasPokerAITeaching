import { Player } from '../types';

type ScoreEntry = {
  id: string;
  name: string;
  score: number; // 正为水上，负为水下
  lastChips: number;
};

export class LeaderboardManager {
  private entries: Record<string, ScoreEntry> = {};
  private rounds = 0;
  private readonly maxRounds = 20;

  init(players: Player[]) {
    this.entries = {};
    players.forEach(p => {
      this.entries[p.id] = { id: p.id, name: p.name, score: 0, lastChips: p.chips };
    });
    this.rounds = 0;
  }

  // 在发牌（新一局开始时）保存当前筹码快照
  capturePreHand(players: Player[]) {
    players.forEach(p => {
      if (!this.entries[p.id]) this.entries[p.id] = { id: p.id, name: p.name, score: 0, lastChips: p.chips };
      else this.entries[p.id].lastChips = p.chips;
    });
  }

  // 在摊牌/结算后调用，计算每位玩家本局的筹码变化并累加到榜单
  recordPostHand(players: Player[]) {
    players.forEach(p => {
      const e = this.entries[p.id];
      if (!e) return;
      const delta = p.chips - e.lastChips;
      e.score += delta;
      e.lastChips = p.chips;
    });
    this.rounds += 1;
  }

  getRanking() {
    return Object.values(this.entries).sort((a, b) => b.score - a.score);
  }

  getPlayerEntry(id: string) {
    return this.entries[id] || null;
  }

  getRounds() {
    return this.rounds;
  }

  shouldEndGame() {
    return this.rounds >= this.maxRounds;
  }

  reset() {
    this.entries = {};
    this.rounds = 0;
  }
}

export const leaderboard = new LeaderboardManager();
