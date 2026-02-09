
# 6+ Poker Arena (小牌德州专业竞技场)

这是一项基于 React 19 和多模态 AI 技术构建的专业级短牌德州扑克（6+ Hold'em）训练与对弈平台。

## 🌟 核心特色

-   **职业风格库**：10+ 位著名职业玩家的精细风格模拟，每位都有独立的"温度"参数（激进度 0-1）。每局游戏时，系统会对每位对手的风格进行随机微调（±0.15），确保同一对手在不同局中的表现风格不完全相同，增强对手多样性。
-   **多 AI 引擎集成 (Multi-AI Support)**：
    -   **GPT-4** ⭐：OpenAI 最强模型，**默认复盘教练**，提供深度博弈分析与顶级策略指导。
    -   **Chatgpt 4o mini**：轻量级备选，用于实时对局决策。
    -   **Doubao (豆包 1.8 Seed)**：字节跳动最新模型，敏捷且具侵略性的对战风格。
    -   **Kimi (Moonshot)**：擅长长上下文逻辑分析，提供稳健的博弈体验。
    -   **DeepSeek V3**：高逻辑性 AI 对手，严密计算赔率与胜率。
-   **上帝视角复盘系统**：对局结束后，AI 教练将获得“上帝视角”（查看所有玩家底牌及动作序列），结合 6+ 扑克数学模型，给出毒辣且专业的策略改进建议。
-   **实时数学反馈 (Monte Carlo)** ✨ **已恢复**：内置蒙特卡洛模拟引擎，200 次迭代计算，实时显示你的赢牌期望（Win Probability）。动态配色指示（>70% 绿色强牌，40-70% 橙色中等，<40% 红色弱牌），助力决策。
-   **长牌起手牌5阶强度参考** ✨：超强手、强手、中强手、中等手、弱手细分，视觉化展示每阶牌力，帮助玩家快速判断手牌价值。
-   **健壮的 API 管理**：内置计费与配额拦截器。当 API 余额不足或触发限流时，系统会提供清晰的 UI 提醒，避免游戏中断。

## 🃏 6+ (短牌) 规则说明

本应用严格遵循国际标准的短牌德州规则：
1.  **牌组**：移除了 2, 3, 4, 5，共 36 张牌。
2.  **牌型大小（6+ 特有）**：
    -   **同花 (Flush) > 葫芦 (Full House)**：因为同花在短牌中更难达成。
    -   **三条 (Three of a Kind) > 顺子 (Straight)**：顺子的达成概率在短牌中显著提高。
3.  **特殊顺子**：A 可作为低位牌，构成 `A-6-7-8-9` 顺子。

## 🛠 技术栈

-   **前端**：React 19, TypeScript, Tailwind CSS.
-   **AI SDK**：`@google/genai` (Gemini API) 及标准 OpenAI 兼容接口。
-   **算法**：自定义扑克逻辑引擎 & 蒙特卡洛模拟器。

## 🔑 环境变量配置

要启用全部 AI 对手和复盘功能，请在环境中配置以下变量：

| 变量名 | 描述 | 获取方式 |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | **推荐**。用于 GPT-4 **默认复盘教练**与实时决策。 | [Openai Platform](https://platform.openai.com/api-keys) |
| `DOUBAO_API_KEY` | 可选。用于启用豆包 AI 对手与备选复盘。 | [火山引擎方舟](https://www.volcengine.com/product/ark) |
| `KIMI_API_KEY` | 可选。用于启用 Kimi AI 对手。 | [Moonshot Platform](https://platform.moonshot.cn/) |
| `DEEPSEEK_API_KEY` | 可选。用于启用 DeepSeek AI 对手。 | [DeepSeek Open Platform](https://platform.deepseek.com/) |

## 📈 优化记录 (Changelog)

-   [x] **职业风格温度随机化** ✨：每位 AI 对手的玩法风格在基础温度上有 ±0.15 的随机波动，增强对手多样性与不可预测性。
-   [x] **AI 提供商平均分配** ✨：进入游戏前，系统默认将 4 款 AI 引擎均匀分配给所有对手，提升对手引擎多样性。
-   [x] **GPT-4 全面升级** ✨：所有 gpt 配置从 mini 升级为完整 GPT-4，AI 对手与复盘质量大幅提升。
-   [x] **长牌5阶强度参考** ✨：超强→强→中强→中等→弱，视觉化色阶，快速判牌。
-   [x] **实时牌型识别** ✨：翻牌后显示用户最大牌型，亮牌时显示所有玩家牌型。
-   [x] **蒙特卡洛显示恢复** ✨：赢牌概率指示器在控制面板实时展示，200 次迭代，动态配色。
-   [x] **上帝视角复盘**：AI 教练可以看到全局底牌，提供"专家级"分析。
-   [x] **豆包支持**：集成 Doubao Seed 1.8 API。
-   [x] **余额报警**：新增 API 余额不足/欠费的前端 UI 友好提示。
-   [x] **多厂商适配**：优化了各厂商模型对 JSON 格式遵循不严的解析兼容性。
-   [x] **持久化**：本地自动保存最近 10 局的胜负统计。

## 本地代理（AI Proxy）

为了避免在浏览器中暴露 API Key、绕过 CORS 限制，并在开发环境中更可靠地调用 AI 提供商，你可以运行本仓库内置的本地代理服务（基于 Express）。

快速使用说明：

1. 在项目根设置服务端环境变量（例：创建 `.env.proxy` 或在命令行中导出）：

```bash
# 示例（请替换为你自己的 Key，切勿提交到版本库）
OPENAI_API_KEY=sk-...
KIMI_API_KEY=...
DEEPSEEK_API_KEY=...
DOUBAO_API_KEY=...
```

2. 安装依赖并启动代理：

```bash
npm install
npm run start:proxy
```

代理默认监听：`http://localhost:8787`，并提供 `/api/proxy` 路径转发到对应 AI 提供商。

3. 启用前端使用代理模式（Vite）：在启动前设置 Vite 环境变量 `VITE_USE_API_PROXY=true`，例如：

```bash
# Windows PowerShell
$env:VITE_USE_API_PROXY='true'; npm run dev

# Windows cmd
set VITE_USE_API_PROXY=true&& npm run dev
```

4. 注意事项：
- 代理仅记录请求的 `provider` 与 prompt 长度、以及响应状态和大小，不会记录完整 prompt 或 AI 返回的内容，减少敏感数据泄露风险。
- 请确保代理运行在受信任网络环境中；生产环境建议使用受管理的后端服务或 serverless 函数来托管代理。


---
*由 AI 驱动，为追求极致的扑克玩家打造。*
