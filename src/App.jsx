import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCcw, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  // قراءة المفتاح من متغيرات البيئة (سيعمل محلياً وعلى Vercel)
  const FINNHUB_API_KEY = import.meta.env.FINNHUB_API_KEY || "ضع_المفتاح_هنا_للتجربة_المحلية";

  const [cash, setCash] = useState(() => parseFloat(localStorage.getItem('trading_cash')) || 100000);
  const [portfolio, setPortfolio] = useState(() => JSON.parse(localStorage.getItem('trading_portfolio')) || {});
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // قائمة الأسهم (الأسعار ستُملأ من API)
  const [prices, setPrices] = useState({
    AAPL: { name: 'Apple Inc.', price: 0, change: 0 },
    TSLA: { name: 'Tesla Inc.', price: 0, change: 0 },
    MSFT: { name: 'Microsoft', price: 0, change: 0 },
    GOOGL: { name: 'Google', price: 0, change: 0 },
  });

  const [chartData, setChartData] = useState([]);

  // 1. جلب الأسعار الحقيقية من Finnhub
  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL'];
        const newPrices = { ...prices };

        for (const symbol of symbols) {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await res.json();
          
          if (data && data.c) {
            newPrices[symbol] = {
              ...newPrices[symbol],
              price: data.c, // السعر الحالي
              change: data.dp, // نسبة التغيير
            };
          }
        }
        setPrices(newPrices);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching prices:", error);
        setIsLoading(false);
      }
    };

    fetchRealPrices();
    const interval = setInterval(fetchRealPrices, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  // 2. تحديث الرسم البياني
  useEffect(() => {
    const data = [];
    let basePrice = prices[selectedStock].price > 0 ? prices[selectedStock].price - 10 : 100;
    for (let i = 0; i < 20; i++) {
      basePrice += (Math.random() - 0.5) * 2;
      data.push({ time: i, price: parseFloat(basePrice.toFixed(2)) });
    }
    if (prices[selectedStock].price > 0) {
      data.push({ time: 20, price: prices[selectedStock].price });
    }
    setChartData(data);
  }, [selectedStock, prices[selectedStock].price]);

  // 3. حفظ البيانات
  useEffect(() => {
    localStorage.setItem('trading_cash', cash.toString());
    localStorage.setItem('trading_portfolio', JSON.stringify(portfolio));
  }, [cash, portfolio]);

  // 4. نظام الإشعارات
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 5. شراء سهم
  const buyStock = (symbol) => {
    const stockPrice = prices[symbol].price;
    if (stockPrice === 0) return;
    if (cash >= stockPrice) {
      setCash(prev => parseFloat((prev - stockPrice).toFixed(2)));
      setPortfolio(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + 1 }));
      showNotification(`تم شراء 1 ${symbol} بنجاح!`, 'success');
    } else {
      showNotification('لا تملك سيولة كافية!', 'error');
    }
  };

  // 6. بيع سهم
  const sellStock = (symbol) => {
    if (portfolio[symbol] > 0) {
      const stockPrice = prices[symbol].price;
      setCash(prev => parseFloat((prev + stockPrice).toFixed(2)));
      setPortfolio(prev => ({ ...prev, [symbol]: prev[symbol] - 1 }));
      showNotification(`تم بيع 1 ${symbol} بنجاح!`, 'success');
    }
  };

  const totalPortfolioValue = Object.keys(portfolio).reduce((total, symbol) => {
    return total + (portfolio[symbol] * prices[symbol].price);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans" dir="rtl">
      
      {/* شاشة الإشعارات */}
      {notification && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle /> : <AlertCircle />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* الشريط العلوي */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Activity className="text-blue-400" size={32} /> 
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              منصة التداول الحقيقية
              {isLoading && <RefreshCcw className="animate-spin text-blue-400" size={20} />}
            </h1>
            <p className="text-sm text-slate-400">أسعار مباشرة من السوق الأمريكي</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 flex flex-col">
            <span className="text-xs text-slate-400 mb-1">السيولة النقدية</span>
            <div className="flex items-center gap-2">
              <Wallet className="text-emerald-400" size={20} />
              <span className="font-bold text-xl text-emerald-400">${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 flex flex-col">
            <span className="text-xs text-slate-400 mb-1">قيمة الأسهم</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={20} />
              <span className="font-bold text-xl text-blue-400">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* لوحة السوق */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 pb-3 border-b border-slate-700">
              <RefreshCcw size={18} className="text-blue-400" /> السوق المباشر
            </h2>
            <div className="space-y-2">
              {Object.keys(prices).map(symbol => (
                <button 
                  key={symbol} 
                  onClick={() => setSelectedStock(symbol)}
                  className={`w-full text-right p-3 rounded-xl transition-all duration-200 ${selectedStock === symbol ? 'bg-blue-600 shadow-lg text-white transform scale-[1.02]' : 'bg-slate-900 hover:bg-slate-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{symbol}</span>
                    <span className={`font-mono ${selectedStock === symbol ? 'text-white' : 'text-slate-300'}`}>
                      {prices[symbol].price > 0 ? `$${prices[symbol].price.toFixed(2)}` : 'جاري التحميل...'}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center text-xs mt-1 ${prices[symbol].change >= 0 ? 'text-emerald-400' : 'text-red-400'} ${selectedStock === symbol ? 'text-emerald-200' : ''}`}>
                    <span>{prices[symbol].name}</span>
                    <span className="flex items-center gap-1">
                      {prices[symbol].change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {prices[symbol].price > 0 ? `${prices[symbol].change > 0 ? '+' : ''}${prices[symbol].change?.toFixed(2)}%` : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* الرسم البياني */}
        <div className="lg:col-span-3 bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col p-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{prices[selectedStock].name}</h2>
              <span className="text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded text-sm">{selectedStock}</span>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-mono font-bold ${prices[selectedStock].change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {prices[selectedStock].price > 0 ? `$${prices[selectedStock].price.toFixed(2)}` : '...'}
              </div>
              <div className={`text-sm mt-1 flex items-center justify-end gap-1 font-bold ${prices[selectedStock].change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {prices[selectedStock].price > 0 ? (
                  <>{prices[selectedStock].change >= 0 ? '+' : ''}{prices[selectedStock].change}% اليوم</>
                ) : 'انتظر التحميل...'}
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'السعر']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={prices[selectedStock].change >= 0 ? '#34d399' : '#f87171'} 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => buyStock(selectedStock)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 text-lg disabled:opacity-50"
              disabled={prices[selectedStock].price === 0}
            >
              شراء {selectedStock}
            </button>
            <button 
              onClick={() => sellStock(selectedStock)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={!portfolio[selectedStock] || portfolio[selectedStock] === 0}
            >
              بيع {selectedStock}
            </button>
          </div>
        </div>
      </div>

      {/* محفظتي */}
      <div className="mt-8 bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Wallet size={24} className="text-blue-400" /> محفظتي الاستثمارية
        </h2>
        
        {Object.keys(portfolio).filter(symbol => portfolio[symbol] > 0).length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-dashed border-slate-700">
            <Wallet size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">محفظتك فارغة. ابدأ التداول الآن!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(portfolio).map(symbol => {
              if (portfolio[symbol] === 0) return null;
              const currentValue = portfolio[symbol] * prices[symbol].price;
              return (
                <div key={symbol} className="bg-slate-900 p-5 rounded-xl border border-slate-700 relative overflow-hidden group">
                  <div className={`absolute right-0 top-0 w-1 h-full ${prices[symbol].change >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-xl text-white">{symbol}</div>
                      <div className="text-xs text-slate-400 mt-1">{portfolio[symbol]} سهم</div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-mono font-bold text-white">${currentValue.toFixed(2)}</div>
                      <div className={`text-xs text-right ${prices[symbol].change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {prices[symbol].change >= 0 ? '+' : ''}{((currentValue / (portfolio[symbol] * prices[symbol].price) - 1) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}