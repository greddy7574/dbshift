const { useState, useCallback } = require('react');

const useCommandHistory = () => {
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState(new Map());

  const addToHistory = useCallback((command) => {
    setHistory(prev => {
      // 避免连续重复的命令
      if (prev.length > 0 && prev[prev.length - 1] === command) {
        return prev;
      }
      
      // 保持历史记录在合理范围内
      const newHistory = [command, ...prev.slice(0, 99)];
      return newHistory;
    });

    // 更新使用频率
    setUsage(prev => {
      const newUsage = new Map(prev);
      newUsage.set(command, (newUsage.get(command) || 0) + 1);
      return newUsage;
    });
  }, []);

  const getHistory = useCallback(() => {
    return history;
  }, [history]);

  const getFrequentCommands = useCallback((limit = 5) => {
    return Array.from(usage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([command, count]) => ({ command, usage: count }));
  }, [usage]);

  const getSuggestions = useCallback((partial, limit = 3) => {
    return history
      .filter(cmd => cmd.startsWith(partial))
      .slice(0, limit);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUsage(new Map());
  }, []);

  return {
    addToHistory,
    getHistory,
    getFrequentCommands,
    getSuggestions,
    clearHistory
  };
};

module.exports = { useCommandHistory };