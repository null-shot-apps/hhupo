'use client';

import { useState, useEffect, useRef } from 'react';

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  timestamp: number;
}

interface Badge {
  id: string;
  name: string;
  emoji: string;
  earned: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: number;
}

export default function CryptoTradingGame() {
  const [balance, setBalance] = useState(10000);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Crypto Trading Simulator! You start with $10,000. Type commands like "buy 0.5 BTC" or "sell 100 ETH" to trade.',
      sender: 'system',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({
    BTC: { symbol: 'BTC', price: 45000, change24h: 2.5 },
    ETH: { symbol: 'ETH', price: 2800, change24h: -1.2 },
    SOL: { symbol: 'SOL', price: 110, change24h: 5.8 },
    DOGE: { symbol: 'DOGE', price: 0.15, change24h: -3.1 }
  });
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', name: 'First Trade', emoji: '🎯', earned: false },
    { id: '2', name: 'Profit Master', emoji: '💰', earned: false },
    { id: '3', name: 'Risk Taker', emoji: '🎲', earned: false },
    { id: '4', name: 'Diamond Hands', emoji: '💎', earned: false }
  ]);
  const [totalProfit, setTotalProfit] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          const change = (Math.random() - 0.5) * 0.02; // ±1% change
          updated[symbol].price = updated[symbol].price * (1 + change);
          updated[symbol].change24h = updated[symbol].change24h + (Math.random() - 0.5) * 0.5;
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'system') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now()
    }]);
  };

  const checkBadges = (newTrades: Trade[], newBalance: number, newPortfolio: Record<string, number>) => {
    setBadges(prev => {
      const updated = [...prev];
      
      // First Trade badge
      if (newTrades.length >= 1 && !updated[0].earned) {
        updated[0].earned = true;
        addMessage('🎉 Badge Earned: First Trade!', 'system');
      }
      
      // Profit Master badge (10% profit)
      if (newBalance > 11000 && !updated[1].earned) {
        updated[1].earned = true;
        addMessage('🎉 Badge Earned: Profit Master! You made 10% profit!', 'system');
      }
      
      // Risk Taker badge (single trade > $2000)
      const hasLargeTrade = newTrades.some(t => t.amount * t.price > 2000);
      if (hasLargeTrade && !updated[2].earned) {
        updated[2].earned = true;
        addMessage('🎉 Badge Earned: Risk Taker! Big trade executed!', 'system');
      }
      
      // Diamond Hands badge (hold 3+ different cryptos)
      if (Object.keys(newPortfolio).length >= 3 && !updated[3].earned) {
        updated[3].earned = true;
        addMessage('🎉 Badge Earned: Diamond Hands! Diversified portfolio!', 'system');
      }
      
      return updated;
    });
  };

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    addMessage(command, 'user');

    // Help command
    if (cmd === 'help') {
      addMessage('Commands: "buy [amount] [symbol]", "sell [amount] [symbol]", "portfolio", "prices", "leaderboard", "badges"', 'system');
      return;
    }

    // Prices command
    if (cmd === 'prices') {
      const priceList = Object.values(prices).map(p => 
        `${p.symbol}: $${p.price.toFixed(2)} (${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`
      ).join('\n');
      addMessage(`Current Prices:\n${priceList}`, 'system');
      return;
    }

    // Portfolio command
    if (cmd === 'portfolio') {
      if (Object.keys(portfolio).length === 0) {
        addMessage('Your portfolio is empty. Start trading!', 'system');
        return;
      }
      let portfolioValue = balance;
      const holdings = Object.entries(portfolio).map(([symbol, amount]) => {
        const value = amount * prices[symbol].price;
        portfolioValue += value;
        return `${symbol}: ${amount.toFixed(4)} ($${value.toFixed(2)})`;
      }).join('\n');
      const profit = portfolioValue - 10000;
      addMessage(`Your Holdings:\n${holdings}\n\nCash: $${balance.toFixed(2)}\nTotal Value: $${portfolioValue.toFixed(2)}\nProfit/Loss: $${profit.toFixed(2)} (${((profit/10000)*100).toFixed(2)}%)`, 'system');
      return;
    }

    // Badges command
    if (cmd === 'badges') {
      const badgeList = badges.map(b => `${b.emoji} ${b.name} ${b.earned ? '✅' : '🔒'}`).join('\n');
      addMessage(`Your Badges:\n${badgeList}`, 'system');
      return;
    }

    // Leaderboard command
    if (cmd === 'leaderboard') {
      addMessage('🏆 Leaderboard:\n1. You - $' + (balance + Object.entries(portfolio).reduce((sum, [sym, amt]) => sum + amt * prices[sym].price, 0)).toFixed(2), 'system');
      return;
    }

    // Buy command
    const buyMatch = cmd.match(/^buy\s+([\d.]+)\s+(\w+)$/);
    if (buyMatch) {
      const amount = parseFloat(buyMatch[1]);
      const symbol = buyMatch[2].toUpperCase();
      
      if (!prices[symbol]) {
        addMessage(`Unknown crypto: ${symbol}. Available: BTC, ETH, SOL, DOGE`, 'system');
        return;
      }
      
      const cost = amount * prices[symbol].price;
      if (cost > balance) {
        addMessage(`Insufficient funds! You need $${cost.toFixed(2)} but have $${balance.toFixed(2)}`, 'system');
        return;
      }
      
      const newBalance = balance - cost;
      const newPortfolio = { ...portfolio, [symbol]: (portfolio[symbol] || 0) + amount };
      const newTrade: Trade = {
        id: Date.now().toString(),
        type: 'buy',
        symbol,
        amount,
        price: prices[symbol].price,
        timestamp: Date.now()
      };
      
      setBalance(newBalance);
      setPortfolio(newPortfolio);
      const newTrades = [...trades, newTrade];
      setTrades(newTrades);
      
      addMessage(`✅ Bought ${amount} ${symbol} for $${cost.toFixed(2)} at $${prices[symbol].price.toFixed(2)} each`, 'system');
      checkBadges(newTrades, newBalance, newPortfolio);
      return;
    }

    // Sell command
    const sellMatch = cmd.match(/^sell\s+([\d.]+)\s+(\w+)$/);
    if (sellMatch) {
      const amount = parseFloat(sellMatch[1]);
      const symbol = sellMatch[2].toUpperCase();
      
      if (!prices[symbol]) {
        addMessage(`Unknown crypto: ${symbol}. Available: BTC, ETH, SOL, DOGE`, 'system');
        return;
      }
      
      if (!portfolio[symbol] || portfolio[symbol] < amount) {
        addMessage(`Insufficient ${symbol}! You have ${portfolio[symbol] || 0}`, 'system');
        return;
      }
      
      const revenue = amount * prices[symbol].price;
      const newBalance = balance + revenue;
      const newPortfolio = { ...portfolio, [symbol]: portfolio[symbol] - amount };
      if (newPortfolio[symbol] === 0) delete newPortfolio[symbol];
      
      const newTrade: Trade = {
        id: Date.now().toString(),
        type: 'sell',
        symbol,
        amount,
        price: prices[symbol].price,
        timestamp: Date.now()
      };
      
      setBalance(newBalance);
      setPortfolio(newPortfolio);
      const newTrades = [...trades, newTrade];
      setTrades(newTrades);
      
      addMessage(`✅ Sold ${amount} ${symbol} for $${revenue.toFixed(2)} at $${prices[symbol].price.toFixed(2)} each`, 'system');
      checkBadges(newTrades, newBalance, newPortfolio);
      return;
    }

    addMessage('Unknown command. Type "help" for available commands.', 'system');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input);
    setInput('');
  };

  const portfolioValue = balance + Object.entries(portfolio).reduce((sum, [symbol, amount]) => 
    sum + amount * prices[symbol].price, 0
  );
  const profitLoss = portfolioValue - 10000;
  const profitPercent = (profitLoss / 10000) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <h1 className="text-4xl font-bold mb-2">🚀 Crypto Trading Simulator</h1>
          <p className="text-purple-300">Trade crypto with chat commands • Earn badges • Climb the leaderboard</p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-sm text-purple-300 mb-1">Cash Balance</div>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-sm text-purple-300 mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold">${portfolioValue.toFixed(2)}</div>
          </div>
          <div className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20`}>
            <div className="text-sm text-purple-300 mb-1">Profit/Loss</div>
            <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitPercent.toFixed(1)}%)
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-sm text-purple-300 mb-1">Badges Earned</div>
            <div className="text-2xl font-bold">{badges.filter(b => b.earned).length}/{badges.length}</div>
            <div className="text-lg mt-1">{badges.filter(b => b.earned).map(b => b.emoji).join(' ')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/20">
              <h2 className="text-xl font-bold">💬 Trading Terminal</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/20 text-white'
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Type command (e.g., "buy 0.1 BTC" or "help")'
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live Prices */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4">
              <h3 className="text-lg font-bold mb-3">📊 Live Prices</h3>
              <div className="space-y-2">
                {Object.values(prices).map(crypto => (
                  <div key={crypto.symbol} className="flex justify-between items-center">
                    <span className="font-semibold">{crypto.symbol}</span>
                    <div className="text-right">
                      <div className="font-mono">${crypto.price.toFixed(2)}</div>
                      <div className={`text-xs ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4">
              <h3 className="text-lg font-bold mb-3">🏅 Badges</h3>
              <div className="space-y-2">
                {badges.map(badge => (
                  <div key={badge.id} className={`flex items-center gap-2 ${badge.earned ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-sm">{badge.name}</span>
                    {badge.earned && <span className="ml-auto text-green-400">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Commands */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4">
              <h3 className="text-lg font-bold mb-3">⚡ Quick Commands</h3>
              <div className="space-y-1 text-sm text-purple-300">
                <div>• <code className="text-white">help</code> - Show all commands</div>
                <div>• <code className="text-white">prices</code> - View all prices</div>
                <div>• <code className="text-white">portfolio</code> - Your holdings</div>
                <div>• <code className="text-white">badges</code> - Your achievements</div>
                <div>• <code className="text-white">buy [amt] [coin]</code></div>
                <div>• <code className="text-white">sell [amt] [coin]</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

