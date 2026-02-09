
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, BettingAction, GamePhase, Player, PlayerAction, HandHistoryEntry, AiProvider, GameMode } from './types';
import { createDeck, evaluateHand, calculateWinProbability, shuffle } from './services/pokerUtils';
import { UnifiedPokerAI } from './services/aiService';
import { INITIAL_CHIPS, SMALL_BLIND, BIG_BLIND, PRO_PLAYER_STYLES } from './constants';
import { PokerTable } from './components/PokerTable';
import { Controls } from './components/Controls';
import { AnalysisPanel } from './components/AnalysisPanel';
import { HandChart } from './components/HandChart';
import Leaderboard from './components/Leaderboard';
import { leaderboard } from './services/leaderboard';

const aiService = new UnifiedPokerAI();

// 环境变量检查
const checkEnvironmentVariables = () => {
  const hasAnyKey = !!(process.env.OPENAI_API_KEY || process.env.KIMI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.DOUBAO_API_KEY);
  
  if (!hasAnyKey) {
    console.warn('⚠️ WARNING: No API keys found in environment variables!');
    console.warn('Please ensure .env.local is configured and dev server was restarted.');
    return false;
  }
  
  console.log('✅ Environment variables loaded:');
  console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓' : '✗');
  console.log('  - KIMI_API_KEY:', process.env.KIMI_API_KEY ? '✓' : '✗');
  console.log('  - DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✓' : '✗');
  console.log('  - DOUBAO_API_KEY:', process.env.DOUBAO_API_KEY ? '✓' : '✗');
  return true;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [menuMode, setMenuMode] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('SHORT');
  
  const [playerCount, setPlayerCount] = useState(3);
  const [aiConfigs, setAiConfigs] = useState<AiProvider[]>(() => Array.from({ length: 3 - 1 }).map(() => 'gpt'));
  const [reviewProvider, setReviewProvider] = useState<AiProvider>('gpt'); // 复盘教练引擎选择
  
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [apiError, setApiError] = useState<{title: string, message: string} | null>(null);
  const [localHistory, setLocalHistory] = useState<HandHistoryEntry[]>([]);
  const [streetBetCount, setStreetBetCount] = useState(0); 
  const processingRef = useRef(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('poker_history');
    if (savedHistory) setLocalHistory(JSON.parse(savedHistory));
    
    // 环境变量检查
    checkEnvironmentVariables();
  }, []);

  useEffect(() => {
    if (!gameState || gameState.phase === 'SHOWDOWN' || loading || processingRef.current || apiError) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.type === 'ai' && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      const timer = setTimeout(() => {
        runAiTurn(gameState, gameState.currentPlayerIndex);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, loading, apiError]);

  useEffect(() => {
    if (!gameState || gameState.phase === 'SHOWDOWN' || apiError) return;
    const user = gameState.players[0];
    if (user.isFolded || user.holeCards.length < 2) return;
    const activeOpponents = gameState.players.filter((p, i) => i !== 0 && !p.isFolded).length;
    if (activeOpponents > 0) {
      const prob = calculateWinProbability(user.holeCards, gameState.communityCards, activeOpponents, gameState.gameMode);
      if (Math.abs(prob - gameState.userWinProb) > 1) {
        setGameState(prev => prev ? { ...prev, userWinProb: prob } : null);
      }
    }
  }, [gameState?.communityCards.length, gameState?.players.map(p => p.isFolded).join(','), apiError]);

  const initGame = () => {
    const oppCount = Math.max(0, playerCount - 1);
    let styles = shuffle([...PRO_PLAYER_STYLES]);
    if (styles.length < oppCount) {
      const ext: typeof styles = [];
      for (let i = 0; i < oppCount; i++) ext.push(styles[i % styles.length]);
      styles = ext;
    } else {
      styles = styles.slice(0, oppCount);
    }

    const players: Player[] = Array.from({ length: playerCount }).map((_, i) => {
      const style = i === 0 ? undefined : styles[i - 1];
      // 为每个 AI 对手添加随机温度变化（±0.1-0.15 的范围波动）
      let adjustedStyle = style;
      if (style && i > 0) {
        const tempVariance = (Math.random() - 0.5) * 0.3; // ±0.15 的变化
        adjustedStyle = {
          ...style,
          temperature: Math.max(0.3, Math.min(1.0, (style.temperature || 0.5) + tempVariance))
        };
      }
      
      return {
        id: `p${i}`,
        name: i === 0 ? '你' : `${adjustedStyle?.name || 'AI'} (${(aiConfigs[i - 1] || 'gpt').toUpperCase()})`,
        type: i === 0 ? 'human' : 'ai',
        provider: i === 0 ? undefined : (aiConfigs[i - 1] || 'gpt'),
        chips: INITIAL_CHIPS,
        holeCards: [],
        isFolded: false,
        isAllIn: false,
        lastAction: '',
        currentBet: 0,
        hasActedThisStreet: false,
        proStyle: i === 0 ? undefined : (adjustedStyle ? adjustedStyle.description : undefined)
      };
    });
    const initialState: GameState = {
      gameMode: selectedMode,
      deck: [], players, communityCards: [], pot: 0, minRaise: BIG_BLIND * 2, currentBet: 0,
      dealerIndex: 0, currentPlayerIndex: 1, phase: 'PREFLOP', handHistory: [],
      userWinProb: 0, showAnalysis: false, analysisText: '', allInShowdown: false,
      reviewProvider: reviewProvider // 存入 GameState
    };
    setGameState(initialState);
    // 初始化榜单（本场内存）
    leaderboard.init(initialState.players);
    setSetupMode(false);
    setMenuMode(false);
    setTimeout(() => dealNewHand(initialState, true), 100);
  };

  const dealNewHand = (currentState: GameState, isFirst: boolean = false) => {
    const deck = createDeck(currentState.gameMode);
    const dealerIdx = isFirst ? 0 : (currentState.dealerIndex + 1) % currentState.players.length;
    const sbIdx = (dealerIdx + 1) % currentState.players.length;
    const bbIdx = (dealerIdx + 2) % currentState.players.length;
    const utgIdx = (dealerIdx + 3) % currentState.players.length;

    const newPlayers = currentState.players.map((p, i) => {
      let bet = 0;
      if (i === sbIdx) bet = Math.min(SMALL_BLIND, p.chips);
      if (i === bbIdx) bet = Math.min(BIG_BLIND, p.chips);
      return {
        ...p,
        holeCards: [deck.pop()!, deck.pop()!],
        isFolded: p.chips <= 0,
        isAllIn: p.chips <= bet && bet > 0,
        lastAction: i === sbIdx ? 'SB' : i === bbIdx ? 'BB' : '',
        hasActedThisStreet: false,
        currentBet: bet,
        chips: p.chips - bet
      };
    });

    // 找到第一个需要行动的玩家（未弃牌且未ALLIN）
    let firstActorIdx = utgIdx;
    let attempts = 0;
    while ((newPlayers[firstActorIdx].isFolded || newPlayers[firstActorIdx].isAllIn) && attempts < newPlayers.length) {
      firstActorIdx = (firstActorIdx + 1) % newPlayers.length;
      attempts++;
    }

    // 如果所有玩家都弃牌或ALLIN，那么手牌应该立即resolve，但这不应该在dealNewHand发生
    // 保持原始値以防万一
    if (attempts >= newPlayers.length) {
      firstActorIdx = utgIdx;
    }

    setStreetBetCount(1); 
    setGameState({
      ...currentState,
      deck,
      players: newPlayers,
      communityCards: [],
      pot: newPlayers.reduce((sum, p) => sum + p.currentBet, 0),
      currentBet: BIG_BLIND,
      minRaise: BIG_BLIND * 2,
      dealerIndex: dealerIdx,
      currentPlayerIndex: firstActorIdx,
      phase: 'PREFLOP',
      handHistory: [],
      showAnalysis: false,
      analysisText: '',
      allInShowdown: false
    });
    // Capture pre-hand chips for leaderboard delta calculation
    leaderboard.capturePreHand(newPlayers);
  };

  const handleAction = async (playerId: string, action: BettingAction, amount: number) => {
    if (!gameState || processingRef.current) return;
    processingRef.current = true;

    setGameState(prev => {
      if (!prev) { processingRef.current = false; return null; }
      const players = [...prev.players];
      const pIdx = players.findIndex(p => p.id === playerId);
      let p = { ...players[pIdx], hasActedThisStreet: true, lastAction: action };
      let delta = 0;
      let newCurrentBet = prev.currentBet;

      if (action === 'FOLD') {
        p.isFolded = true;
      } else if (action === 'CALL') {
        delta = Math.min(prev.currentBet - p.currentBet, p.chips);
        p.chips -= delta;
        p.currentBet += delta;
        if (p.chips === 0) p.isAllIn = true;
      } else if (['RAISE', '3BET', '4BET', 'ALLIN', 'CHECK'].includes(action)) {
        if (action === 'CHECK') {
          delta = 0;
        } else {
          // Ensure the requested total amount does not exceed player's total chips (currentBet + chips)
          const requestedTotal = amount;
          const maxTotal = p.currentBet + p.chips; // maximum total this player can have in the pot this street
          const safeTotal = Math.min(requestedTotal, maxTotal);
          delta = safeTotal - p.currentBet;
          // If requested amount is less than or equal to currentBet, treat as CALL
          if (safeTotal <= p.currentBet) {
            delta = Math.min(prev.currentBet - p.currentBet, p.chips);
            p.chips -= delta;
            p.currentBet += delta;
          } else {
            p.chips -= delta;
            p.currentBet += delta;
            newCurrentBet = p.currentBet;
            setStreetBetCount(c => c + 1);
          }
        }
        if (p.chips === 0 && action !== 'CHECK') p.isAllIn = true;
      }

      players[pIdx] = p;
      const activePlayers = players.filter(pl => !pl.isFolded);
      const bettors = activePlayers.filter(pl => !pl.isAllIn);
      const allMatched = bettors.every(pl => pl.currentBet === newCurrentBet && pl.hasActedThisStreet);

      const updatedState: GameState = {
        ...prev,
        players,
        pot: prev.pot + delta,
        currentBet: newCurrentBet,
        minRaise: newCurrentBet + (newCurrentBet - (prev.currentBet || BIG_BLIND)),
        handHistory: [...prev.handHistory, { playerId, playerName: p.name, action, amount: delta, phase: prev.phase }]
      };

      // 街道结束条件：
      // 1. 只剩1个未弃牌玩家 → 其他都弃了
      // 2. 所有非ALLIN玩家都跟注到相同金额且都已行动 → 可以进行下一街
      // 3. 只有1个非ALLIN玩家（其他都ALLIN了）且已跟注最高金额 → 可以进行下一街
      const isStreetOver = 
        activePlayers.length <= 1 ||  // 只有1个或0个玩家未弃牌
        (bettors.length === 0) ||      // 所有活跃玩家都已ALLIN
        (allMatched && bettors.length >= 1);  // 所有非ALLIN玩家都跟注到相同金额且已行动

      if (isStreetOver) {
        setTimeout(() => {
          setStreetBetCount(0);
          advancePhase(updatedState);
        }, 500);
        processingRef.current = false;
        return updatedState;
      } else {
        // 找下一个需要行动的玩家
        // 条件：未弃牌 且 未ALLIN
        let nextIdx = (pIdx + 1) % players.length;
        while (players[nextIdx].isFolded || players[nextIdx].isAllIn) {
          nextIdx = (nextIdx + 1) % players.length;
          // 防止无限循环：如果绕回到当前玩家，说明没有其他玩家可以行动
          if (nextIdx === pIdx) {
            // 所有其他玩家都已ALLIN或弃牌，街道应该结束
            setStreetBetCount(0);
            setTimeout(() => advancePhase(updatedState), 500);
            processingRef.current = false;
            return updatedState;
          }
        }
        processingRef.current = false;
        return { ...updatedState, currentPlayerIndex: nextIdx };
      }
    });
  };

  const advancePhase = (state: GameState) => {
    let { phase, deck, communityCards, players } = state;
    const newDeck = [...deck];
    const newCommunity = [...communityCards];
    let nextPhase: GamePhase = phase;
    const activePlayers = players.filter(p => !p.isFolded);
    
    if (activePlayers.length <= 1) { resolveHand(state); return; }

    if (phase === 'PREFLOP') {
      nextPhase = 'FLOP';
      if (newDeck.length >= 3) newCommunity.push(newDeck.pop()!, newDeck.pop()!, newDeck.pop()!);
    } else if (phase === 'FLOP') {
      nextPhase = 'TURN';
      if (newDeck.length >= 1) newCommunity.push(newDeck.pop()!);
    } else if (phase === 'TURN') {
      nextPhase = 'RIVER';
      if (newDeck.length >= 1) newCommunity.push(newDeck.pop()!);
    } else if (phase === 'RIVER') {
      nextPhase = 'SHOWDOWN';
    }

    const resetPlayers = players.map(p => ({ ...p, currentBet: 0, lastAction: '', hasActedThisStreet: false }));
    const canActCount = resetPlayers.filter(p => !p.isFolded && !p.isAllIn).length;
    
    const isAllInShowdown = canActCount <= 1 && nextPhase !== 'SHOWDOWN';

    const nextState: GameState = {
      ...state,
      phase: nextPhase,
      deck: newDeck,
      communityCards: newCommunity,
      players: resetPlayers,
      currentBet: 0,
      minRaise: BIG_BLIND,
      allInShowdown: state.allInShowdown || isAllInShowdown,
      currentPlayerIndex: nextPhase === 'SHOWDOWN' ? -1 : (state.dealerIndex + 1) % state.players.length
    };

    setGameState(nextState);

    if (nextPhase === 'SHOWDOWN') {
      resolveHand(nextState);
    } else if (isAllInShowdown || state.allInShowdown) {
      // 所有非ALLIN玩家都已弃牌，或只有一个能行动，直接进行所有牌面的showdown
      setTimeout(() => advancePhase(nextState), 1200);
    } else {
      // 找到第一个需要行动的玩家
      let activeIdx = nextState.currentPlayerIndex;
      let attempts = 0;
      while ((resetPlayers[activeIdx].isFolded || resetPlayers[activeIdx].isAllIn) && attempts < resetPlayers.length) {
        activeIdx = (activeIdx + 1) % resetPlayers.length;
        attempts++;
      }
      
      // 防止无限循环，确保找到了有效的玩家
      if (attempts < resetPlayers.length) {
        setGameState({ ...nextState, currentPlayerIndex: activeIdx });
      }
    }
  };

  const resolveHand = async (finalState: GameState) => {
    const winners = evaluateWinners(finalState);
    const potPerWinner = Math.floor(finalState.pot / winners.length);
    const updatedPlayers = finalState.players.map(p => ({
      ...p,
      chips: p.chips + (winners.includes(p.id) ? potPerWinner : 0),
      lastAction: winners.includes(p.id) ? 'WINNER!' : p.lastAction
    }));
    const showdownState: GameState = { ...finalState, players: updatedPlayers, phase: 'SHOWDOWN', currentPlayerIndex: -1, allInShowdown: false };
    setGameState(showdownState);
    saveHistory(winners.includes('p0') ? '胜利' : '失败', `底池: $${finalState.pot}`);
    // 更新榜单：记录本局筹码变化并计数
    leaderboard.recordPostHand(showdownState.players);
    // 如果达到 20 局则结束本场比赛（返回菜单并展示最终榜单）
    if (leaderboard.shouldEndGame()) {
      const ranking = leaderboard.getRanking().map((r, i) => `${i + 1}. ${r.name} - ${r.score >= 0 ? `水上 ${r.score}` : `水下 ${Math.abs(r.score)}`}` ).join('\n');
      alert('本场比赛已结束（20 局）。\n最终榜单：\n' + ranking);
      // 将比赛结束并回到主菜单
      setMenuMode(true);
      setGameState(null);
      return;
    }
    setAnalysisLoading(true);
    try {
      const analysis = await aiService.reviewHand(showdownState);
      setGameState(prev => prev ? ({ ...prev, analysisText: analysis, showAnalysis: true }) : null);
    } catch (e) { console.error(e); } finally { setAnalysisLoading(false); }
  };

  const evaluateWinners = (state: GameState): string[] => {
    const activePlayers = state.players.filter(p => !p.isFolded);
    if (activePlayers.length === 1) return [activePlayers[0].id];
    const evals = activePlayers.map(p => ({ id: p.id, eval: evaluateHand([...p.holeCards, ...state.communityCards], state.gameMode) }));
    evals.sort((a, b) => b.eval.rank - a.eval.rank || b.eval.value - a.eval.value);
    const best = evals[0];
    return evals.filter(e => e.eval.rank === best.eval.rank && e.eval.value === best.eval.value).map(e => e.id);
  };

  const saveHistory = (result: string, summary: string) => {
    const newEntry: HandHistoryEntry = { timestamp: Date.now(), result, summary };
    setLocalHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 10);
      localStorage.setItem('poker_history', JSON.stringify(updated));
      return updated;
    });
  };

  const runAiTurn = async (state: GameState, idx: number) => {
    setLoading(true);
    try {
      const dec = await aiService.decideAction(state, idx);
      // Clamp AI decided amount to player's available chips + currentBet (can't bet more than you have)
      const player = state.players[idx];
      const maxTotal = player.currentBet + player.chips; // total that player can have in the pot this street
      const safeAmount = Math.min(dec.amount || 0, maxTotal);
      handleAction(state.players[idx].id, dec.action, safeAmount);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === "BILLING_EXHAUSTED") {
        setApiError({ title: "休眠", message: "API 余额不足" });
      } else if (msg === 'NETWORK_ERROR') {
        setApiError({ title: '网络错误', message: '无法连接到 AI 后端。请检查代理服务或网络连接，或启用本地代理（USE_API_PROXY=true）。' });
      } else if (msg && msg.includes('INVALID_JSON_RESPONSE')) {
        setApiError({ title: '响应解析失败', message: 'AI 返回内容无法解析为 JSON。请检查代理或模型响应格式。' });
      } else {
        setApiError({ title: 'AI 调用失败', message: msg });
      }
      handleAction(state.players[idx].id, state.currentBet <= state.players[idx].currentBet ? 'CHECK' : 'FOLD', 0);
    } finally { setLoading(false); }
  };

  if (menuMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <div className="mb-12 text-center">
             <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] border-4 border-white/20">
                <i className="fas fa-spade text-slate-900 text-4xl"></i>
             </div>
             <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">POKER ARENA</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">AI Powered Training Platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
             <button 
              onClick={() => { setSelectedMode('LONG'); setSetupMode(true); setMenuMode(false); }}
              className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-8 text-left transition-all hover:scale-105 hover:border-red-500/50 hover:shadow-[0_0_60px_rgba(239,68,68,0.1)]"
             >
                <div className="absolute top-4 right-6 text-slate-800 group-hover:text-red-500/20 text-6xl font-black transition-colors">52</div>
                <h2 className="text-2xl font-black text-white mb-2">经典长牌</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">标准 52 张牌规则。顺子 {'>'} 三条，葫芦 {'>'} 同花。最经典的技术博弈体验。</p>
                <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-widest">
                   <span>进入赛场</span>
                   <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                </div>
             </button>

             <button 
              onClick={() => { setSelectedMode('SHORT'); setSetupMode(true); setMenuMode(false); }}
              className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-8 text-left transition-all hover:scale-105 hover:border-amber-500/50 hover:shadow-[0_0_60px_rgba(245,158,11,0.1)]"
             >
                <div className="absolute top-4 right-6 text-slate-800 group-hover:text-amber-500/20 text-6xl font-black transition-colors">36</div>
                <h2 className="text-2xl font-black text-white mb-2">精英短牌</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">移除了 2-5 的 36 张牌模式。同花 {'>'} 葫芦，三条 {'>'} 顺子。更激进的底池，更高的牌效。</p>
                <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-widest">
                   <span>进入赛场</span>
                   <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                </div>
             </button>
          </div>
          
          <div className="mt-16 flex gap-8 text-slate-600">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><i className="fas fa-shield-halved"></i> GTO Logic</div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><i className="fas fa-microchip"></i> Multi-AI Support</div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><i className="fas fa-graduation-cap"></i> Pro Analysis</div>
          </div>
        </div>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-xl w-full shadow-2xl relative">
          <button onClick={() => { setMenuMode(true); setSetupMode(false); }} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
             <i className="fas fa-arrow-left mr-2"></i> 返回菜单
          </button>
          <h1 className="text-3xl font-black mb-10 text-center text-white mt-4 uppercase tracking-tighter">
            {selectedMode === 'SHORT' ? '精英短牌' : '经典长牌'} 对局配置
          </h1>
          <div className="space-y-6 mb-8">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-3 text-center">选择玩家人数</label>
              <div className="flex justify-center gap-2">
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button key={n} onClick={() => {
                    setPlayerCount(n);
                    const desired = Math.max(0, n - 1);
                    // 平均分配 AI 提供商
                    const aiProviders: AiProvider[] = ['gpt', 'doubao', 'kimi', 'deepseek'];
                    const newConfigs = Array.from({ length: desired }).map((_, i) => 
                      aiProviders[i % aiProviders.length]
                    );
                    setAiConfigs(newConfigs);
                  }} className={`w-12 h-12 rounded-xl font-bold transition-all ${playerCount === n ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-400'}`}>{n}</button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <label className="text-xs font-bold text-slate-400 uppercase block mb-3">复盘教练引擎</label>
              <select 
                value={reviewProvider} 
                onChange={(e) => setReviewProvider(e.target.value as AiProvider)} 
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="gpt">OpenAI GPT-4 (默认) - 顶级分析</option>
                <option value="doubao">字节豆包 (Doubao) - 敏捷分析</option>
                <option value="kimi">Moonshot Kimi - 长文本逻辑</option>
                <option value="deepseek">DeepSeek AI - 严密计算</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: Math.max(0, playerCount - 1) }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                  <div className="text-xs font-bold mb-2 text-slate-400">对手 {i + 1} AI 引擎</div>
                  <select value={aiConfigs[i]} onChange={(e) => { const n = [...aiConfigs]; n[i] = e.target.value as AiProvider; setAiConfigs(n); }} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs outline-none">
                    <option value="doubao">字节豆包 (Doubao)</option>
                    <option value="gpt">OpenAI GPT-4 Mini</option>
                    <option value="kimi">Moonshot Kimi</option>
                    <option value="deepseek">DeepSeek AI</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <button onClick={initGame} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95">开始对局</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <header className="px-6 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-40 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => setMenuMode(true)} className="text-slate-400 hover:text-white transition-colors"><i className="fas fa-home"></i></button>
          <div className="h-4 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center"><i className="fas fa-spade text-slate-900 text-xs"></i></div>
            <h1 className="font-black text-sm uppercase tracking-tighter">Arena Pro</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(loading || analysisLoading) && <div className="text-amber-500 text-[10px] animate-pulse font-bold tracking-widest uppercase"><i className="fas fa-robot mr-1"></i> {analysisLoading ? 'AI 复盘中' : 'AI 决策中'}</div>}
          <button onClick={() => dealNewHand(gameState!)} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 hover:bg-slate-700 transition-colors">重新洗牌</button>
          <button onClick={() => setShowLeaderboard(true)} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 hover:bg-slate-700 transition-colors">榜单</button>
        </div>
      </header>

      {apiError && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"><div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl max-w-md w-full p-8"><h2 className="text-xl font-black text-white text-center mb-3">{apiError.title}</h2><p className="text-slate-400 text-center text-sm mb-8">{apiError.message}</p><button onClick={() => setApiError(null)} className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">明白</button></div></div>}

      <main className="flex-1 container mx-auto p-3 flex flex-col lg:flex-row gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0"><PokerTable state={gameState!} /></div>
        <aside className="w-full lg:w-80 space-y-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
          <HandChart mode={gameState?.gameMode} />
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3 flex flex-col h-[300px]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><i className="fas fa-history text-amber-500"></i> 对局记录</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
              {gameState?.handHistory.length === 0 ? <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic">等待首个动作...</div> : gameState?.handHistory.map((h, i) => (
                <div key={i} className="text-[11px] bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 flex justify-between items-start animate-fadeIn">
                  <div className="flex flex-col"><span className={`font-bold ${h.playerId === 'p0' ? 'text-amber-400' : 'text-slate-300'}`}>{h.playerName}</span><span className="text-slate-500 text-[9px] uppercase">{h.phase}</span></div>
                  <div className="flex flex-col items-end"><span className="text-white font-black">{h.action}</span>{h.amount > 0 && <span className="text-amber-500/80 text-[10px]">${h.amount}</span>}</div>
                </div>
              )).reverse()}
            </div>
            <div className="pt-4 border-t border-slate-800"><h3 className="text-[10px] text-slate-500 uppercase mb-2">近期趋势</h3><div className="flex flex-wrap gap-1.5">{localHistory.map((e, i) => (<div key={i} className={`px-2 py-0.5 rounded text-[9px] font-black border ${e.result === '胜利' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{e.result[0]}</div>))}</div></div>
          </div>
        </aside>
      </main>
      
      {gameState?.phase !== 'SHOWDOWN' ? (
        <Controls
          disabled={gameState!.players[gameState!.currentPlayerIndex].type !== 'human' || loading || !!apiError}
          onAction={(act, amt) => handleAction(gameState!.players[0].id, act, amt)}
          canCheck={gameState!.currentBet <= gameState!.players[0].currentBet}
          currentBet={gameState!.currentBet} 
          minRaise={gameState!.minRaise} 
          chips={gameState!.players[0].chips}
          pot={gameState!.pot}
          betCount={streetBetCount}
          winProbability={gameState!.userWinProb}
        />
      ) : (
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-center items-center gap-4">
           {analysisLoading ? <div className="text-amber-500 font-black animate-pulse flex items-center gap-2"><i className="fas fa-spinner fa-spin"></i> 复盘报告准备中...</div> : 
             <button onClick={() => dealNewHand(gameState!)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-4 px-12 rounded-2xl shadow-xl active:scale-95 transition-all">下一局</button>}
        </div>
      )}
      {gameState?.showAnalysis && <AnalysisPanel analysis={gameState.analysisText} onClose={() => setGameState(p => p ? {...p, showAnalysis: false} : null)} />}
      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
};

export default App;
