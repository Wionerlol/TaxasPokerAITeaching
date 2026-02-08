
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, BettingAction, Player } from "../types";

export class PokerAI {
  // Guidelines: Do not create GoogleGenAI when the component is first rendered or in constructor.
  
  async decideAction(state: GameState, aiPlayerIndex: number): Promise<{ action: BettingAction; amount: number; thought: string }> {
    const aiPlayer = state.players[aiPlayerIndex];
    const otherPlayers = state.players.filter((_, i) => i !== aiPlayerIndex && !_.isFolded);
    
    const prompt = `
      你正在玩 6+ (短牌) 德州扑克。桌上有 ${state.players.length} 名玩家。
      规则: 同花 > 葫芦, 三条 > 顺子。
      
      当前状态:
      阶段: ${state.phase}
      你的名字: ${aiPlayer.name} (AI)
      你的筹码: ${aiPlayer.chips}
      你的手牌: ${aiPlayer.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}
      
      公共牌: ${state.communityCards.map(c => `${c.rank}${c.suit}`).join(', ')}
      当前底池: ${state.pot}
      当前最高下注 (Current Bet): ${state.currentBet}
      你当前在该轮已下注: ${aiPlayer.currentBet}
      其他活跃玩家: ${otherPlayers.map(p => `${p.name}(筹码:${p.chips}, 本轮已下注:${p.currentBet})`).join('; ')}
      
      请根据牌力、位置和对手筹码决定操作。操作可以是: FOLD, CHECK, CALL, RAISE, 或 ALLIN。
      如果是加注，请指定在该轮的总下注金额（必须大于当前最高下注且通常至少是其两倍）。
      
      返回 JSON 格式: { "action": "...", "amount": 0, "thought": "中文思考过程" }
    `;

    try {
      // Guidelines: Always use process.env.API_KEY directly and instantiate right before call.
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY or API_KEY environment variable");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              thought: { type: Type.STRING }
            },
            required: ['action', 'amount', 'thought']
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error(e);
      return { action: state.currentBet > aiPlayer.currentBet ? 'FOLD' : 'CHECK', amount: 0, thought: '解析出错，保守操作。' };
    }
  }

  async reviewHand(state: GameState): Promise<string> {
    const humanPlayer = state.players.find(p => p.type === 'human') || state.players[0];
    const prompt = `
      你是一位专业的 6+ (短牌) 德州扑克教练。请复盘这手多人对局。
      
      对局总结:
      玩家数: ${state.players.length}
      公共牌: ${state.communityCards.map(c => `${c.rank}${c.suit}`).join(', ')}
      用户手牌: ${humanPlayer.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}
      其他玩家手牌公开: ${state.players.filter(p => p.id !== humanPlayer.id).map(p => `${p.name}: ${p.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}`).join('; ')}
      
      动作序列:
      ${state.handHistory.map(h => `${h.playerName}: ${h.action} ${h.amount} (${h.phase})`).join('\n')}
      
      请用中文分析用户的表现:
      1. 分析用户在每一条街(Pre-flop, Flop, Turn, River)的操作是否合理。
      2. 解释多人底池(Multi-way pot)下的胜率变化。
      3. 给出针对该局的具体建议。
      请使用 Markdown 格式。
    `;

    try {
      // Guidelines: Always use process.env.API_KEY directly and instantiate right before call.
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY or API_KEY environment variable");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-pro',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      return "暂时无法生成分析。";
    }
  }
}
