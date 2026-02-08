
import { GameState, BettingAction, AiProvider, Player } from "../types";
import { evaluateHand } from "./pokerUtils";
import { SMALL_BLIND, BIG_BLIND } from "../constants";

export class UnifiedPokerAI {

  private async callGenericApi(endpoint: string, key: string, prompt: string, provider: string, isReview: boolean = false) {
    try {
      let modelName = '';
      if (provider === 'gpt') modelName = 'gpt-4';
      else if (provider === 'kimi') modelName = 'moonshot-v1-8k';
      else if (provider === 'deepseek') modelName = 'deepseek-chat';
      else if (provider === 'doubao') modelName = 'doubao-1-8-seed';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          ...(isReview ? {} : { response_format: provider !== 'doubao' ? { type: 'json_object' } : undefined })
        })
      });
      
      if (response.status === 402 || response.status === 403) throw new Error("BILLING_EXHAUSTED");
      if (response.status === 401) throw new Error("INVALID_API_KEY");
      if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error("API returned empty content");
      
      if (isReview) return content;
      const jsonStr = content.match(/\{[\s\S]*\}/)?.[0] || content;
      return JSON.parse(jsonStr);
    } catch (e: any) {
      throw e;
    }
  }

  async decideAction(state: GameState, aiIdx: number): Promise<{ action: BettingAction; amount: number; thought: string }> {
    const aiPlayer = state.players[aiIdx];
    const provider = aiPlayer.provider || 'gpt';
    const isShort = state.gameMode === 'SHORT';
    
    const rulesNote = isShort 
      ? "这是 6+ (短牌) 模式: 同花 > 葫芦, 三条 > 顺子。" 
      : "这是标准长牌 (52张) 模式: 顺子 > 三条, 葫芦 > 同花。";

    const styleNote = aiPlayer.proStyle ? `\n【你的游玩风格参考】\n${aiPlayer.proStyle}` : "";

    const prompt = `你正在玩${isShort ? '短牌 (6+)' : '标准长牌'}德州扑克。${styleNote}
    【核心规则】${rulesNote}
    【盲注结构】SB: $${SMALL_BLIND} / BB: $${BIG_BLIND}
    【当前对局】
    阶段: ${state.phase}
    你的名字: ${aiPlayer.name} (AI)
    你的筹码: $${aiPlayer.chips}
    你的手牌: ${aiPlayer.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}
    公共牌: ${state.communityCards.map(c => `${c.rank}${c.suit}`).join(', ')}
    当前底池: $${state.pot}
    当前最高下注 (Current Bet): $${state.currentBet}
    你当前在该轮已下注: $${aiPlayer.currentBet}
    其他活跃玩家: ${state.players.filter((_, i) => i !== aiIdx && !_.isFolded).map(p => `${p.name}(筹码:${p.chips}, 本轮已下注:${p.currentBet})`).join('; ')}

    请根据牌力、位置和对手筹码决定操作。操作可以是: FOLD, CHECK, CALL, RAISE, 或 ALLIN。
    重要规则：不得下注超过自己的可用筹码；如果选择加注，请确保总下注金额不超过你的筹码总量（包含你本轮已下注）；在决定加注大小时必须考虑：
    - 你的剩余筹码（Stack Depth）和投入占比
    - 主要对手的筹码深度，是否能覆盖你的下注或会被你的下注全下（过顶/短筹码情况）
    - 多人底池下的有效下注（pot odds 和对手可能的跟注能力）
    如果是加注，请指定在该轮的总下注金额（必须大于当前最高下注且通常至少是其两倍，除非为 ALLIN）。

    返回 JSON 格式: { "action": "...", "amount": 0, "thought": "中文思考过程" }
    `;

    try {
      if (provider === 'gpt' && process.env.OPENAI_API_KEY) {
        return await this.callGenericApi('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, prompt, 'gpt');
      } else if (provider === 'kimi' && process.env.KIMI_API_KEY) {
        return await this.callGenericApi('https://api.moonshot.cn/v1/chat/completions', process.env.KIMI_API_KEY, prompt, 'kimi');
      } else if (provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
        return await this.callGenericApi('https://api.deepseek.com/chat/completions', process.env.DEEPSEEK_API_KEY, prompt, 'deepseek');
      } else if (provider === 'doubao' && process.env.DOUBAO_API_KEY) {
        return await this.callGenericApi('https://ark.cn-beijing.volces.com/api/v3/chat/completions', process.env.DOUBAO_API_KEY, prompt, 'doubao');
      }

      console.warn(`No API key found for provider ${provider}, trying fallbacks...`);
      // 自动尝试其他供应商
      if (process.env.KIMI_API_KEY) try { return await this.callGenericApi('https://api.moonshot.cn/v1/chat/completions', process.env.KIMI_API_KEY, prompt, 'kimi'); } catch (e) { console.warn('Kimi fallback failed:', e); }
      if (process.env.DEEPSEEK_API_KEY) try { return await this.callGenericApi('https://api.deepseek.com/chat/completions', process.env.DEEPSEEK_API_KEY, prompt, 'deepseek'); } catch (e) { console.warn('DeepSeek fallback failed:', e); }
      if (process.env.DOUBAO_API_KEY) try { return await this.callGenericApi('https://ark.cn-beijing.volces.com/api/v3/chat/completions', process.env.DOUBAO_API_KEY, prompt, 'doubao'); } catch (e) { console.warn('DouBao fallback failed:', e); }
      if (process.env.OPENAI_API_KEY) try { return await this.callGenericApi('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, prompt, 'gpt'); } catch (e) { console.warn('GPT fallback failed:', e); }

      return { action: state.currentBet > aiPlayer.currentBet ? 'FOLD' : 'CHECK', amount: 0, thought: 'AI 决策异常，保守操作。' };
    } catch (e: any) {
      console.error("AI decision failed:", e);
      return { action: state.currentBet > aiPlayer.currentBet ? 'FOLD' : 'CHECK', amount: 0, thought: 'AI 决策失败，保守操作。' };
    }
  }

  async reviewHand(state: GameState): Promise<string> {
    const humanPlayer = state.players.find(p => p.type === 'human') || state.players[0];
    const isShort = state.gameMode === 'SHORT';
    const historyText = state.handHistory.map((h, i) => `${i + 1}. [${h.phase}] ${h.playerName}: ${h.action} $${h.amount}`).join('\n');
    const provider = state.reviewProvider || 'gpt';

    const prompt = `你是一位顶级的扑克教练。请复盘此局。
    模式: ${isShort ? '6+ 短牌' : '标准长牌 (52张)'}
    规则重点: ${isShort ? '同花>葫芦, 三条>顺子' : '葫芦>同花, 顺子>三条'}
    底池: $${state.pot} | 动作流:
    ${historyText}
    【上帝视角】
    用户手牌: ${humanPlayer.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}
    最终公共牌: ${state.communityCards.map(c => `${c.rank}${c.suit}`).join(', ')}
    其他玩家底牌: ${state.players.filter(p => p.id !== humanPlayer.id).map(p => `${p.name}: ${p.holeCards.map(c => `${c.rank}${c.suit}`).join(', ')}`).join('; ')}
    请评价用户表现并给出针对性建议，使用简洁的 Markdown 格式。`;

    try {
      // 尝试用户选择的供应商
      if (provider === 'gpt' && process.env.OPENAI_API_KEY) {
        return await this.callGenericApi('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, prompt, 'gpt', true);
      } else if (provider === 'kimi' && process.env.KIMI_API_KEY) {
        return await this.callGenericApi('https://api.moonshot.cn/v1/chat/completions', process.env.KIMI_API_KEY, prompt, 'kimi', true);
      } else if (provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
        return await this.callGenericApi('https://api.deepseek.com/chat/completions', process.env.DEEPSEEK_API_KEY, prompt, 'deepseek', true);
      } else if (provider === 'doubao' && process.env.DOUBAO_API_KEY) {
        return await this.callGenericApi('https://ark.cn-beijing.volces.com/api/v3/chat/completions', process.env.DOUBAO_API_KEY, prompt, 'doubao', true);
      }
    } catch (e: any) {
      console.warn(`Review with ${provider} failed:`, e.message);
    }

    // 自动兜底逻辑：寻找第一个可用的 Key
    console.log('Attempting fallback providers...');
    
    if (process.env.OPENAI_API_KEY) {
      try { 
        console.log('Trying GPT fallback...');
        return await this.callGenericApi('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, prompt, 'gpt', true); 
      } catch (e) { 
        console.warn('GPT fallback failed:', e);
      }
    }
    
    if (process.env.KIMI_API_KEY) {
      try { 
        console.log('Trying Kimi fallback...');
        return await this.callGenericApi('https://api.moonshot.cn/v1/chat/completions', process.env.KIMI_API_KEY, prompt, 'kimi', true); 
      } catch (e) { 
        console.warn('Kimi fallback failed:', e);
      }
    }
    
    if (process.env.DEEPSEEK_API_KEY) {
      try { 
        console.log('Trying DeepSeek fallback...');
        return await this.callGenericApi('https://api.deepseek.com/chat/completions', process.env.DEEPSEEK_API_KEY, prompt, 'deepseek', true); 
      } catch (e) { 
        console.warn('DeepSeek fallback failed:', e);
      }
    }
    
    if (process.env.DOUBAO_API_KEY) {
      try { 
        console.log('Trying DouBao fallback...');
        return await this.callGenericApi('https://ark.cn-beijing.volces.com/api/v3/chat/completions', process.env.DOUBAO_API_KEY, prompt, 'doubao', true); 
      } catch (e) { 
        console.warn('DouBao fallback failed:', e);
      }
    }

    return "复盘失败：所有 AI 供应商均不可用或 API Key 校验失败。请检查 .env.local 文件中的 API Key 是否正确配置。";
  }
}
