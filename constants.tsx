import React from "react";

export const INITIAL_CHIPS = 10000;
export const SMALL_BLIND = 50;
export const BIG_BLIND = 100;

export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_FA_ICONS = {
  hearts: "fa-solid fa-heart",
  diamonds: "fa-solid fa-diamond",
  clubs: "fa-solid fa-club",
  spades: "fa-solid fa-spade",
};

export const SUIT_COLORS = {
  hearts: "text-red-600",
  diamonds: "text-red-600",
  clubs: "text-slate-900",
  spades: "text-slate-900",
};

// 6+ (短牌) 起手牌矩阵
export const SHORT_HAND_STRENGTH_CHART = [
  ["AA", "AKs", "AQs", "AJs", "ATs"],
  ["AKo", "KK", "KQs", "KJs", "KTs"],
  ["AQo", "KQo", "QQ", "QJs", "QTs"],
  ["AJo", "KJo", "QJo", "JJ", "JTs"],
  ["ATo", "KTo", "QTo", "JTo", "TT"]
];

// 标准 (长牌) 起手牌矩阵 - 5阶强度 (参考 GTO 最优范围)
export const LONG_HAND_STRENGTH_CHART = [
  // 第1阶 - 超强手 (Premium)
  ["AA", "AKs", "AQs", "AJs", "KK"],
  // 第2阶 - 强手 (Strong)
  ["AKo", "KQs", "KJs", "QQ", "AQo"],
  // 第3阶 - 中强手 (Medium-Strong)
  ["KQo", "QJs", "JJ", "AJs", "KTs"],
  // 第4阶 - 中等手 (Medium)
  ["QTo", "JTo", "TT", "99", "KJo"],
  // 第5阶 - 弱手 (Weak-Playable)
  ["88", "77", "66", "55", "QJo"]
];

// 职业玩家风格描述库 - 增加温度参数（温度越高越激进且不稳定）
export const PRO_PLAYER_STYLES = [
  {
    name: "Tom Dwan (毒王)",
    description: "极其激进且不可预测。擅长在大底池进行超额下注（Overbet）进行博弈，经常使用边缘手牌进行 3-bet 和 4-bet。非常注重对手的弃牌率，即便牌面完全没中也会通过巨大的下注压力让对手怀疑人生。倾向于两极化的范围：要么极强，要么纯诈唬。",
    temperature: 0.95
  },
  {
    name: "Tan Xuan (谈轩)",
    description: "短牌天才，波动极大。拥有极强的创造力和读牌感，下注尺寸天马行空。他会充分利用 6+ 规则中三条大于顺子的特性进行激进进攻。他喜欢看翻牌，但在转牌和河牌会通过极其重的手术刀式加注来试探对手的底线。非常关注筹码深度，倾向于在深筹码下通过全下（All-in）给对手制造巨大的数学难题。",
    temperature: 0.92
  },
  {
    name: "Andy Stacks",
    description: "教科书式的平衡风格（GTO风格）。非常严谨的范围估计，下注尺寸通常非常合理（1/3底池或2/3底池）。他会仔细计算每一条街的胜率，很少进行鲁莽的自杀式诈唬。他非常看重自己的\"后手筹码\"和生命力，如果他加注很大，通常代表他已经锁定了胜局或拥有极高的底池权益。",
    temperature: 0.52
  },
  {
    name: "Phil Ivey",
    description: "全能战神。能够根据桌上的态势实时调整风格。他拥有无与伦比的\"读人\"能力，如果你显得软弱，他会通过不断的 Check-Raise 和小规模试探将你蚕食。他非常擅长估算对手的范围，并利用位置优势进行控池。他很少被对手的诈唬吓退，同时他的 3-bet 频率非常高，意在在翻牌前就接管底池。",
    temperature: 0.72
  },
  {
    name: "Garrett Adelstein",
    description: "高压锅式风格。一旦他参与牌局，他会通过连续的下注（Barrel）保持进攻性。他擅长计算复杂的成牌组合，喜欢在顺子或同花听牌面通过半诈唬（Semi-bluff）获利。如果你选择跟注他，你必须做好在每一条街都要面对大额下注的心理准备。",
    temperature: 0.85
  },
  {
    name: "Daniel Negreanu",
    description: "极强的读人能力与范围感。擅长通过持续施压和小注控制池底，寻找对手的弱点并在转牌/河牌通过巧妙的下注剥离价值。他的玩法偏向中等下注频率与高频率的价值下注。",
    temperature: 0.65
  },
  {
    name: "Fedor Holz",
    description: "数据驱动且极致高效的进攻风格。深度计算筹码-赔率和远期价值，善于在短牌中用精准的下注尺寸剥离价值或实现半诈唬。他在深筹码结构下非常危险，常用小规模激进手段逼迫对手犯错。",
    temperature: 0.68
  },
  {
    name: "Viktor Blom (Isildur1)",
    description: "不可预测的高波动玩家。经常用极端线与大小下注混合策略，擅长用高频率的3-bet与4-bet造成混乱。对抗他的玩家必须非常稳健，否则容易被其短期激进风格碾压。",
    temperature: 0.88
  },
  {
    name: "Liv Boeree",
    description: "策略稳健且位置意识强的选手。擅长用位置与范围控制底池，不喜欢毫无根据的冒险，更倾向于在有明确权益时才进行大额动作。她的下注通常反映了精确计算的EV与对手范围。",
    temperature: 0.48
  },
  {
    name: "Doyle Brunson",
    description: "老派但极具智慧的打法，善于在各种桌面中调整节奏。他会利用经验和历史读牌来设陷阱，偏好通过长期价值与逆向思维来获利。面对他的老练打法，耐心和纪律是关键。",
    temperature: 0.58
  }
];
