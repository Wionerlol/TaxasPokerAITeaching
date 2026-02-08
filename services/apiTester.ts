
/**
 * 快速验证 API Key 是否有效
 * 在浏览器 console 中运行此测试
 */
export async function testApiConnections() {
  console.log('🧪 Starting API connection tests...\n');
  
  const results: Record<string, string> = {};

  // 测试 OpenAI GPT
  try {
    console.log('Testing OpenAI GPT...');
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      results['GPT'] = '❌ No API Key';
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello, say "OK" in one word.' }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        results['GPT'] = `✅ ${data.choices[0]?.message?.content?.substring(0, 50) || 'OK'}`;
      } else {
        results['GPT'] = `❌ HTTP ${response.status}`;
      }
    }
  } catch (e: any) {
    results['GPT'] = `❌ ${e.message?.substring(0, 80) || 'Network error'}`;
  }

  // 测试 Kimi (Moonshot)
  try {
    console.log('Testing Kimi...');
    const key = process.env.KIMI_API_KEY;
    if (!key) {
      results['Kimi'] = '❌ No API Key';
    } else {
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [{ role: 'user', content: 'Hello, say "OK" in one word.' }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        results['Kimi'] = `✅ ${data.choices[0]?.message?.content?.substring(0, 50) || 'OK'}`;
      } else {
        results['Kimi'] = `❌ HTTP ${response.status}`;
      }
    }
  } catch (e: any) {
    results['Kimi'] = `❌ ${e.message?.substring(0, 80) || 'Network error'}`;
  }

  // 测试 DeepSeek
  try {
    console.log('Testing DeepSeek...');
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      results['DeepSeek'] = '❌ No API Key';
    } else {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello, say "OK" in one word.' }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        results['DeepSeek'] = `✅ ${data.choices[0]?.message?.content?.substring(0, 50) || 'OK'}`;
      } else {
        results['DeepSeek'] = `❌ HTTP ${response.status}`;
      }
    }
  } catch (e: any) {
    results['DeepSeek'] = `❌ ${e.message?.substring(0, 80) || 'Network error'}`;
  }

  // 测试 DouBao
  try {
    console.log('Testing DouBao...');
    const key = process.env.DOUBAO_API_KEY;
    if (!key) {
      results['DouBao'] = '❌ No API Key';
    } else {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'doubao-1-8-seed',
          messages: [{ role: 'user', content: 'Hello, say "OK" in one word.' }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        results['DouBao'] = `✅ ${data.choices[0]?.message?.content?.substring(0, 50) || 'OK'}`;
      } else {
        results['DouBao'] = `❌ HTTP ${response.status}`;
      }
    }
  } catch (e: any) {
    results['DouBao'] = `❌ ${e.message?.substring(0, 80) || 'Network error'}`;
  }

  // 打印结果
  console.group('📊 API Connection Test Results');
  console.table(results);
  console.log('\n✅ = Working | ❌ = Not working');
  console.log('If all show "No API Key", restart dev server: npm run dev');
  console.groupEnd();

  return results;
}

// 使用方法：
// 1. 在浏览器 Console 中执行: testApiConnections()
// 或
// 2. 在 App.tsx 中添加:
//    import { testApiConnections } from './services/apiTester';
//    useEffect(() => { testApiConnections(); }, []);
