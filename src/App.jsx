import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCcw, Activity, Save } from 'lucide-react';

export default function App() {
  // 1. جلب المحفظة من الذاكرة المحلية (LocalStorage) أو البدء برصيد جديد
  const [cash, setCash] = useState(() => {
    const savedCash = localStorage.getItem('trading_cash');
    return savedCash ? parseFloat(savedCash) : 100000;
  });
  
  const [portfolio, setPortfolio] = useState(() => {
    const savedPortfolio = localStorage.getItem('trading_portfolio');
    return savedPortfolio ? JSON.parse(savedPortfolio) : {};
  });

  const [selectedStock, setSelectedStock] = useState('AAPL');
  
  // 2. أسعار حقيقية (تبدأ بقيم افتراضية حتى يتم التحميل)
  const [prices, setPrices] = useState({
    AAPL: { name: 'Apple Inc.', price: 175.50, change: 0 },
    TSLA: { name: 'Tesla Inc.', price: 240.20, change: 0 },
    MSFT: { name: 'Microsoft', price: 420.00, change: 0 },
    GOOGL: { name: 'Google', price: 150.00, change: 0 },
  });

  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3. حفظ البيانات تلقائياً في المتصفح عند كل تغيير
  useEffect(() => {
    localStorage.setItem('trading_cash', cash.toString());
    localStorage.setItem('trading_portfolio', JSON.stringify(portfolio));
  }, [cash, portfolio]);

  // 4. جلب الأسعار الحقيقية من واجهة برمجية مجانية
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // استخدام واجهة Finnhub المجانية
        const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL'];
        const newPrices = { ...prices };
        
        for (const symbol of symbols) {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=c9e8j9aad3i9b7r7t9a0`); // مفتاح تجريبي
          const data = await res.json();
          if (data.c) { // سعر الإغلاق الحالي
            newPrices[symbol].price = data.c;
            newPrices[symbol].change = data.dp; // نسبة التغيير
          }
        }
        setPrices(newPrices);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching prices:", error);
        setIsLoading(false); // في حال فشل الاتصال، نوقف التحميل ونستخدم الأسعار الافتراضية
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  // 5. تحديث الرسم البياني
  useEffect(() => {
    const data = [];
    let basePrice = prices[selectedStock].price - 10;
    for (let i = 0; i < 20; i++) {
      basePrice += (Math.random() - 0.5) * 2;
      data.push({ time: i, price: parseFloat(basePrice.toFixed(2)) });
    }
    data.push({ time: 20, price: prices[selectedStock].price });
    setChartData(data);
  }, [selectedStock, prices[selectedStock].price]);

  // 6. شراء سهم
  const buyStock = (symbol) => {
    const stockPrice = prices[symbol].price;
    if (cash >= stockPrice) {
      setCash(prev => parseFloat((prev - stockPrice).toFixed(2)));
      setPortfolio(prev => ({
        ...prev,
        [symbol]: (prev[symbol] || 0) + 1
      }));
    } else {
      alert('لا تملك سيولة كافية!');
    }
  };

  // 7. بيع سهم
  const sellStock = (symbol) => {
    if (portfolio[symbol] > 0) {
      const stockPrice = prices[symbol].price;
      setCash(prev => parseFloat((prev + stockPrice).toFixed(2)));
      setPortfolio(prev => ({
        ...prev,
        [symbol]: prev[symbol] - 1
      }));
    }
  };

  // 8. تصفير الحساب (للتجربة)
  const resetAccount = () => {
    if (window.confirm('هل أنت متأكد من تصفير حسابك؟')) {
      setCash(100000);
      setPortfolio({});
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4 md:mb-0">
          <Activity className="text-blue-500" /> 
          محاكي التداول الحقيقي {isLoading && <span className="text-sm text-yellow-500 animate-pulse">(جاري تحديث الأسعار...)</span>}
        </h1>
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 px-6 py-3 rounded-lg border border-gray-600 flex items-center gap-3 shadow-inner">
            <Wallet className="text-green-400" size={24} />
            <span className="text-sm text-gray-400">السيولة:</span>
            <span className="font-bold text-2xl text-green-400 tracking-wider">
              ${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button onClick={resetAccount} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
            تصفير الحساب
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لوحة السوق */}
        <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 pb-2 border-b border-gray-600">
            <RefreshCcw size={18} className="text-blue-400" /> السوق الحي
          </h2>
          <div className="space-y-3">
            {Object.keys(prices).map(symbol => (
              <div 
                key={symbol} 
                onClick={() => setSelectedStock(symbol)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${selectedStock === symbol ? 'bg-gray-700 border-r-4 border-blue-500 shadow-md transform scale-[1.02]' : 'bg-gray-900 hover:bg-gray-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-lg">{symbol}</div>
                  <div className={`text-md font-bold ${prices[symbol].change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${prices[symbol].price.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex justify-between mt-1">
                  <span>{prices[symbol].name}</span>
                  <span className={`flex items-center gap-1 font-bold ${prices[symbol].change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prices[symbol].change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {prices[symbol].change >= 0 ? '+' : ''}{prices[symbol].change?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* الرسم البياني */}
        <div className="lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold">{prices[selectedStock].name}</h2>
              <span className="text-gray-400 text-sm">{selectedStock}</span>
            </div>
            <div className={`text-4xl font-bold ${prices[selectedStock].change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${prices[selectedStock].price.toFixed(2)}
            </div>
          </div>
          
          <div className="relative z-10 w-full" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                  formatter={(value) => [`$${value}`, 'السعر']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={prices[selectedStock].change >= 0 ? '#4ade80' : '#f87171'} 
                  strokeWidth={4} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex gap-4 relative z-10">
            <button 
              onClick={() => buyStock(selectedStock)}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(22,163,74,0.5)] transition-all text-lg"
            >
              شراء 1 {selectedStock}
            </button>
            <button 
              onClick={() => sellStock(selectedStock)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all text-lg disabled:opacity-50"
              disabled={!portfolio[selectedStock] || portfolio[selectedStock] === 0}
            >
              بيع 1 {selectedStock}
            </button>
          </div>
        </div>
      </div>

      {/* محفظتي */}
      <div className="mt-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-600 flex items-center gap-2">
          <Save size={20} /> محفظتي (محفوظة تلقائياً)
        </h2>
        {Object.keys(portfolio).filter(symbol => portfolio[symbol] > 0).length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p>لم تقم بشراء أي أسهم بعد. ابدأ التداول الآن!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(portfolio).map(symbol => {
              if (portfolio[symbol] === 0) return null;
              const currentValue = portfolio[symbol] * prices[symbol].price;
              return (
                <div key={symbol} className="bg-gray-900 p-5 rounded-lg border border-gray-700 relative overflow-hidden">
                  <div className={`absolute right-0 top-0 w-1 h-full ${prices[symbol].change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-xl">{symbol}</div>
                    <div className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">الكمية: {portfolio[symbol]}</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">القيمة الحالية:</div>
                  <div className="text-2xl font-bold text-white">${currentValue.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}