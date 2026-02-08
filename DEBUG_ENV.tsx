// 临时调试工具 - 检查环境变量是否正确加载
// 在浏览器控制台运行或在 App.tsx 中临时导入使用

export function debugEnvironmentVariables() {
  const envVars = {
    API_KEY: process.env.API_KEY ? `✓ ${process.env.API_KEY.substring(0, 10)}...` : '✗ undefined',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `✓ ${process.env.GEMINI_API_KEY.substring(0, 10)}...` : '✗ undefined',
    KIMI_API_KEY: process.env.KIMI_API_KEY ? `✓ ${process.env.KIMI_API_KEY.substring(0, 10)}...` : '✗ undefined',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? `✓ ${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...` : '✗ undefined',
    DOUBAO_API_KEY: process.env.DOUBAO_API_KEY ? `✓ ${process.env.DOUBAO_API_KEY.substring(0, 10)}...` : '✗ undefined',
  };

  console.group('🔍 Environment Variables Debug');
  console.table(envVars);
  console.log('💡 Tips:');
  console.log('1. Ensure .env.local exists in project root');
  console.log('2. Check API keys are not empty strings');
  console.log('3. Restart dev server after .env.local changes');
  console.log('4. Check browser Network tab for API errors');
  console.groupEnd();

  return envVars;
}

// 在 App.tsx 中顶部添加这行来调试：
// useEffect(() => { debugEnvironmentVariables(); }, []);
