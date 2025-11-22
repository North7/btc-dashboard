import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  Crosshair, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  Users, 
  Database, 
  CheckCircle2,
  Wallet,
  RefreshCw,
  Zap,
  Calculator,
  X,
  ShieldCheck,
  Anchor,
  BarChart3,
  Scale,
  Globe,
  Brain,
  MessageSquareQuote,
  PlayCircle,
  Info,
  ArrowDown,
  ChevronsUp
} from 'lucide-react';

// --- 1. API Utilities (Real Data Only) ---

const fetchBinancePrice = async () => {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    const data = await res.json();
    return {
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      volume: parseFloat(data.quoteVolume)
    };
  } catch (e) {
    console.error("Binance API Error", e);
    return null;
  }
};

const fetchFearGreed = async () => {
  try {
    const res = await fetch('https://api.alternative.me/fng/');
    const data = await res.json();
    return data.data[0];
  } catch (e) {
    return { value: 50, value_classification: "Neutral" };
  }
};

const fetchKlines = async (interval, limit) => {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`);
    const data = await res.json();
    return data.map(d => parseFloat(d[4])); // Return closing prices
  } catch (e) {
    return [];
  }
};

// --- 2. Technical Indicators (Real-time Calculation) ---

const calculateSMA = (data, period) => {
  if (data.length < period) return 0;
  const slice = data.slice(data.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period - 1; i < prices.length - 1; i++) {
    const diff = prices[i + 1] - prices[i];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateBollingerBands = (prices, period = 20, multiplier = 2) => {
  if (prices.length < period) return { upper: 0, lower: 0, middle: 0, pb: 0.5 };
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(prices.length - period);
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = sma + (multiplier * stdDev);
  const lower = sma - (multiplier * stdDev);
  const currentPrice = prices[prices.length - 1];
  const pb = (currentPrice - lower) / (upper - lower); // %B

  return { upper, lower, middle: sma, pb };
};

const calculateVolatility = (prices, period = 14) => {
  if (prices.length < period) return 0;
  const returns = [];
  for(let i = prices.length - period; i < prices.length; i++) {
    returns.push(Math.abs(prices[i] - prices[i-1]) / prices[i-1]);
  }
  const avgRet = returns.reduce((a,b) => a+b, 0) / period;
  return (avgRet * 100).toFixed(2); // Percentage volatility
};

// --- 3. Components (Apple Style) ---

const DashboardCard = ({ children, className = "", title, icon: Icon, rightElement }) => (
  <div className={`bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-xl shadow-black/20 ${className}`}>
    {title && (
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          {Icon && <div className="p-2 bg-zinc-800/50 rounded-full"><Icon size={18} className="text-zinc-400" /></div>}
          <h3 className="text-zinc-200 font-bold tracking-wide text-base">{title}</h3>
        </div>
        {rightElement}
      </div>
    )}
    {children}
  </div>
);

const IndicatorRow = ({ label, value, subValue, status, score, tooltip }) => {
  let statusColor = "text-zinc-400";
  let statusBg = "bg-zinc-800/50";
  
  if (status === "BUY") { statusColor = "text-green-400"; statusBg = "bg-green-500/10"; }
  if (status === "STRONG BUY") { statusColor = "text-green-400"; statusBg = "bg-green-500/20 border border-green-500/30"; }
  if (status === "WAIT") { statusColor = "text-orange-400"; statusBg = "bg-orange-500/10"; }
  if (status === "SELL") { statusColor = "text-red-400"; statusBg = "bg-red-500/10"; }
  
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0 group relative">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 relative">
          <span className="text-zinc-400 text-sm font-medium">{label}</span>
          {tooltip && (
            <div className="group/tooltip relative flex items-center justify-center">
              <Info size={12} className="text-zinc-600 cursor-help hover:text-blue-400 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-800/95 backdrop-blur-md text-zinc-200 text-[11px] leading-relaxed rounded-xl shadow-2xl border border-white/10 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none text-center">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800/95"></div>
              </div>
            </div>
          )}
        </div>
        {subValue && <span className="text-[11px] text-zinc-500 font-medium">{subValue}</span>}
      </div>
      <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full ${statusBg}`}>
        {score && (
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1.5 h-3 rounded-full transition-all ${i < score ? (status.includes('BUY') ? 'bg-green-500' : 'bg-orange-500') : 'bg-zinc-700'}`} />
            ))}
          </div>
        )}
        <div className={`text-sm font-bold font-mono ${statusColor}`}>{value}</div>
      </div>
    </div>
  );
};

const StrategyModal = ({ isOpen, onClose, currentPrice, buyZones, totalCapital = 10000 }) => {
  if (!isOpen) return null;
  const [capital, setCapital] = useState(totalCapital);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl transform transition-all p-1 overflow-hidden">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><Calculator size={20} /></div>
            智能掛單生成器 (防踏空版)
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="bg-zinc-800/50 p-5 rounded-3xl border border-white/5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3 block">設定總投入資金 (USDT)</label>
            <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-3 rounded-2xl border border-white/10">
              <Wallet className="text-blue-400" size={24} />
              <input 
                type="number" 
                value={capital} 
                onChange={(e) => setCapital(Number(e.target.value))}
                className="bg-transparent text-3xl font-bold text-white focus:outline-none w-full font-mono placeholder-zinc-600"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-xs text-zinc-500 uppercase font-bold px-4">
              <div className="col-span-3">策略層級</div>
              <div className="col-span-3">掛單價格</div>
              <div className="col-span-2">倉位 %</div>
              <div className="col-span-2">金額</div>
              <div className="col-span-2 text-right">BTC 數量</div>
            </div>
            
            {buyZones.map(zone => {
              const amount = capital * (parseFloat(zone.allocation)/100);
              const btcAmount = amount / zone.price;
              let rowBorderColor = zone.lineColor;
              let rowBgColor = zone.barColor.replace('bg-', 'bg-').replace('500', '500/10');

              return (
                <div key={zone.id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border bg-zinc-800/30 backdrop-blur-sm transition-all" style={{borderColor: `${rowBorderColor}40`, backgroundColor: rowBgColor}}>
                  <div className={`col-span-3 font-bold text-sm flex items-center gap-2`} style={{color: rowBorderColor}}>
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: rowBorderColor}}></div>
                    {zone.level.split(' ')[0]}
                  </div>
                  <div className="col-span-3 font-mono text-white text-base font-medium">${zone.price.toLocaleString()}</div>
                  <div className="col-span-2 text-xs bg-black/20 px-2 py-1 rounded-full w-fit font-medium text-zinc-300">{zone.allocation}</div>
                  <div className="col-span-2 font-mono text-white font-medium">${amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <div className="col-span-2 font-mono text-zinc-300 text-right">{btcAmount.toFixed(4)}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 flex gap-4 items-start">
            <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={22} />
            <div className="text-sm text-blue-100 leading-relaxed">
              <strong>執行建議：</strong> 系統已執行「瀑布流約束」，確保買入價格邏輯正確（T1 &gt; T2 &gt; T3），避免因指標糾纏導致的價格倒掛。建議登入交易所設置限價單。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. Main Application Component ---

const App = () => {
  const [marketData, setMarketData] = useState({ price: 0, change: 0, high: 0, low: 0, volume: 0 });
  const [fearGreed, setFearGreed] = useState({ value: 0, value_classification: 'Loading' });
  const [rsi, setRsi] = useState(50);
  const [bb, setBB] = useState({ upper: 0, lower: 0, middle: 0, pb: 0.5 });
  const [volatility, setVolatility] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [calculatedMAs, setCalculatedMAs] = useState({ ma20w: 0, ma50w: 0, ma200w: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [insights, setInsights] = useState({
    snapshot: "數據加載中...",
    retail: "...",
    whale: "...",
    psychology: "...",
    advice: "..."
  });

  const fetchData = async () => {
    setLoading(true);
    const binanceData = await fetchBinancePrice();
    if (binanceData) setMarketData(binanceData);

    const fgData = await fetchFearGreed();
    if (fgData) setFearGreed(fgData);

    const resChart = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=60');
    const dataChart = await resChart.json();
    const formattedChart = dataChart.map(d => ({
      time: new Date(d[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(d[4])
    }));
    setChartData(formattedChart);

    // Use WEEKLY Data for Strategy MAs
    const klines1w = await fetchKlines('1w', 210);
    if (klines1w.length > 0) {
      const currentPrices = klines1w;
      
      const ma20w = calculateSMA(currentPrices, 20);
      const ma50w = calculateSMA(currentPrices, 50);
      const ma200w = calculateSMA(currentPrices, 200);
      
      const bbData = calculateBollingerBands(currentPrices, 20, 2);
      const vol = calculateVolatility(currentPrices, 14);
      
      const klines4hRaw = await fetchKlines('4h', 20);
      const rsiVal = calculateRSI(klines4hRaw);

      setCalculatedMAs({ ma20w, ma50w, ma200w });
      setBB(bbData);
      setVolatility(vol);
      setRsi(rsiVal);
    }

    setLastUpdated(new Date());
    setLoading(false);
  };

  // Insights Logic
  useEffect(() => {
    if (!marketData.price) return;
    const change = marketData.change;
    const fg = parseInt(fearGreed.value);
    let snap = "", ret = "", whl = "", psy = "", adv = "";

    if (change <= -5) {
      snap = "🩸 極度超賣：恐慌盤湧出，情緒達冰點。技術面偏離均線過遠，隨時可能反抽。";
      whl = "聰明錢開始在下方掛單承接恐慌籌碼。";
      psy = "『跌勢好像止不住，要不要先止損？』";
      adv = "這是典型的「黃金坑」。分批買入，不要在恐慌中交出籌碼。";
    } else if (change <= -2) {
      snap = "📉 弱勢回調：正在測試支撐位，短期拋壓尚未消化完畢。";
      whl = "大戶觀望，等待散戶清洗。";
      psy = "『又跌了，好煩，要不要做個波段？』";
      adv = "耐心等待回踩 T1 或 T2 買入區間。";
    } else if (change < 2) {
      snap = "⚖️ 窄幅震盪：多空平衡，等待變盤方向。";
      whl = "鏈上活動平靜。";
      psy = "『盤整好無聊...』";
      adv = "空倉等待，或在布林下軌嘗試小倉位。";
    } else {
      snap = "📈 趨勢向上：價格在均線上方運行，多頭掌控局面。";
      whl = "資金持續流入。";
      psy = "『漲了！要不要追？』";
      adv = "切勿追高，等待回調機會。";
    }

    if (fg < 20) ret = "散戶絕望割肉 (Capitulation)。";
    else if (fg < 40) ret = "散戶驚魂未定，觀望為主。";
    else if (fg > 75) ret = "散戶極度亢奮，注意風險。";
    else ret = "散戶情緒中性。";

    setInsights({ snapshot: snap, retail: ret, whale: whl, psychology: psy, advice: adv });
  }, [marketData, fearGreed]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentP = marketData.price || 60000;

  // REAL DYNAMIC ZONES - WEEKLY CYCLE - WATERFALL CONSTRAINT
  const buyZones = useMemo(() => {
    const ma20w = calculatedMAs.ma20w; 
    const ma50w = calculatedMAs.ma50w;
    const ma200w = calculatedMAs.ma200w;

    // 1. T1: Aggressive Front-Run
    const baseT1 = ma20w > 0 ? ma20w : currentP * 0.85;
    const frontRunT1 = baseT1 * 1.04; 
    const dipBuy = currentP * 0.95; 
    
    let t1Price = Math.floor(Math.max(frontRunT1, dipBuy));
    if (t1Price >= currentP) t1Price = Math.floor(currentP * 0.98); // Safety
    let t1Desc = "搶跑埋伏 (MA20W+)";

    // 2. T2: Moderate
    let t2Price = ma50w > 0 ? Math.floor(ma50w) : Math.floor(currentP * 0.70);
    let t2Desc = "MA50 週線 (中期趨勢)";
    if (t2Price >= currentP) { t2Price = Math.floor(currentP * 0.85); t2Desc = "MA50W 已跌破 (深跌支撐)"; }

    // 3. T3: Extreme
    let t3Price = ma200w > 0 ? Math.floor(ma200w) : Math.floor(currentP * 0.50);
    let t3Desc = "MA200 週線 (週期鐵底)";
    if (t3Price >= currentP) { t3Price = Math.floor(currentP * 0.65); t3Desc = "MA200W 已跌破 (黑天鵝)"; }

    // 4. WATERFALL CONSTRAINT (The Fix)
    if (t2Price >= t1Price) {
        t2Price = Math.floor(t1Price * 0.90);
        t2Desc = "結構性支撐修正 (T1 -10%)";
    }
    if (t3Price >= t2Price) {
        t3Price = Math.floor(t2Price * 0.85);
        t3Desc = "極限底部修正 (T2 -15%)";
    }
    
    return [
      { id: 1, level: "Aggressive (Front-Run)", price: t1Price, allocation: "20%", desc: t1Desc, status: "NEAR", color: "text-orange-400", barColor: "bg-orange-500", lineColor: "#fb923c" },
      { id: 2, level: "Moderate (Support)", price: t2Price, allocation: "40%", desc: t2Desc, status: "WAITING", color: "text-emerald-400", barColor: "bg-emerald-500", lineColor: "#34d399" },
      { id: 3, level: "Extreme (Deep)", price: t3Price, allocation: "40%", desc: t3Desc, status: "WAITING", color: "text-blue-400", barColor: "bg-blue-500", lineColor: "#60a5fa" }
    ];
  }, [currentP, calculatedMAs]);

  const chartDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const prices = chartData.map(d => d.price);
    const minChartPrice = Math.min(...prices);
    const maxChartPrice = Math.max(...prices);
    const minTarget = Math.min(...buyZones.map(z => z.price));
    const effectiveMinTarget = minTarget > 0 ? minTarget : minChartPrice;
    const finalMin = Math.min(minChartPrice, effectiveMinTarget) * 0.95;
    const finalMax = maxChartPrice * 1.02; 
    return [finalMin, finalMax];
  }, [chartData, buyZones]);

  const calculateDistance = (target) => {
    if (!marketData.price) return "0.00";
    const dist = ((marketData.price - target) / marketData.price) * 100;
    return dist.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 lg:p-8 font-sans antialiased selection:bg-blue-500/30">
      <StrategyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentPrice={marketData.price} buyZones={buyZones} />

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-blue-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-300/80">Live • Binance API • {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            BTC 市場數據監控
            <button onClick={fetchData} className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors shadow-sm border border-white/5">
              <RefreshCw size={20} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </h1>
        </div>
        
        <div className="flex items-center gap-6 bg-zinc-900/70 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 shadow-xl shadow-black/20">
          <div className="text-right pl-2">
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Real-time Price</div>
            <div className={`text-3xl font-mono font-extrabold tracking-tighter ${marketData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${marketData.price.toLocaleString()}
            </div>
          </div>
          <div className="h-10 w-px bg-zinc-800"></div>
          <div className="text-right pr-2">
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">24h Change</div>
            <div className={`text-xl font-bold flex items-center justify-end gap-1 ${marketData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {marketData.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {marketData.change.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MACRO INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <DashboardCard className="h-full min-h-[220px]">
          <div className="flex items-center gap-3 mb-5 text-blue-400">
            <div className="p-2 bg-blue-500/20 rounded-full"><Globe size={20} /></div>
            <h2 className="font-bold text-white text-xl tracking-tight">市場全景快照</h2>
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white leading-snug mb-2">"{insights.snapshot}"</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5">
               <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400 font-bold uppercase tracking-wider"><Users size={14}/> 散戶情緒</div>
               <p className="text-sm text-zinc-300 leading-relaxed font-medium">{insights.retail}</p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5">
               <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400 font-bold uppercase tracking-wider"><Database size={14}/> 鯨魚動向</div>
               <p className="text-sm text-zinc-300 leading-relaxed font-medium">{insights.whale}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="h-full min-h-[220px]">
          <div className="flex items-center gap-3 mb-5 text-green-400">
             <div className="p-2 bg-green-500/20 rounded-full"><Brain size={20} /></div>
            <h2 className="font-bold text-white text-xl tracking-tight">交易員心裡鏡像</h2>
          </div>
          <div className="mb-6 pl-5 border-l-4 border-green-500/30">
             <div className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 uppercase flex items-center gap-1.5"><MessageSquareQuote size={14}/> Inner Voice (心聲)</div>
             <p className="text-xl italic text-zinc-200 font-serif leading-relaxed tracking-wide">{insights.psychology}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-3xl mt-auto flex justify-between items-center">
             <div>
               <div className="text-[11px] text-green-400 font-bold uppercase tracking-wider mb-1">Recommended Action</div>
               <div className="text-sm text-white font-bold">{insights.advice}</div>
             </div>
             <div className="p-2 bg-green-500/20 rounded-full text-green-400"><PlayCircle size={24}/></div>
          </div>
        </DashboardCard>
      </div>

      {/* SECTION 2: FULL WIDTH CHART */}
      <div className="mb-8">
        <DashboardCard title="趨勢與戰略伏擊點 (4H Chart / Weekly Cycles)" icon={Activity} className="w-full">
          <div className="h-[380px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/> {/* Apple Blue */}
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#71717a', fontSize: 11, fontWeight: 500}} 
                    minTickGap={40}
                    dy={10}
                />
                <YAxis 
                    domain={chartDomain} 
                    orientation="right" 
                    tick={{fill: '#71717a', fontSize: 11, fontWeight: 500}} 
                    axisLine={false} 
                    tickLine={false} 
                    width={65}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    tickCount={7}
                    dx={5}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px' }} 
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                    cursor={{stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area type="monotone" dataKey="price" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                {buyZones.map((zone, index) => (
                  <ReferenceLine key={zone.id} y={zone.price} stroke={zone.lineColor} strokeDasharray="3 3" strokeWidth={1.5} label={{ position: 'insideLeft', value: `T${index+1}`, fill: zone.lineColor, fontSize: 12, dy: -12, fontWeight: '800', className: "bg-black/50 px-1 rounded" }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-6 pt-4 border-t border-white/5">
            {buyZones.map((zone, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-zinc-800/30 px-4 py-2 rounded-full">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: zone.lineColor}}></div>
                <span className="text-zinc-300 font-semibold text-sm">{zone.level.split(' ')[0]} (${zone.price.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* SECTION 3: DATA & EXECUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Col 1: Dynamic Zones */}
        <div className="space-y-6">
          <DashboardCard title="戰略伏擊區 (大週期 Weekly)" icon={Crosshair} className="h-full">
            <div className="space-y-4 mt-2">
              {buyZones.map((zone) => {
                const distance = calculateDistance(zone.price);
                return (
                  <div key={zone.id} className="relative p-4 rounded-[1.5rem] bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/5 transition-all duration-300 group overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-1.5 w-full rounded-b-[1.5rem] overflow-hidden opacity-80">
                       <div className={`h-full ${zone.barColor}`} style={{width: `${Math.max(5, 100 - parseFloat(distance)*2.5)}%`, transition: 'width 0.5s ease-out'}} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-extrabold tracking-wide ${zone.color}`}>{zone.level.split(' ')[0]}</span>
                      <span className="text-[11px] font-bold text-zinc-500 bg-zinc-900/50 px-2.5 py-1 rounded-full uppercase tracking-wider">Alloc: {zone.allocation}</span>
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-1.5">
                      <span className="text-2xl font-extrabold text-white tracking-tight font-mono">${zone.price.toLocaleString()}</span>
                      <span className={`text-sm font-bold ${parseFloat(distance) > 0 ? 'text-orange-400' : 'text-green-400'}`}>-{distance}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-3 pt-3 border-t border-white/5 leading-relaxed font-medium">{zone.desc}</p>
                  </div>
                )
              })}
            </div>
          </DashboardCard>
        </div>

        {/* Col 2: Indicators & Supports */}
        <div className="space-y-6">
           <DashboardCard title="技術分析 (Real-time)" icon={Database} className="h-full">
            <div className="space-y-1">
              <IndicatorRow label="RSI (4H)" value={rsi.toFixed(1)} status={rsi < 30 ? "STRONG BUY" : rsi < 45 ? "BUY" : rsi > 70 ? "SELL" : "WAIT"} score={rsi < 30 ? 5 : rsi < 45 ? 4 : 2} tooltip="4小時 RSI，低於 30 代表短線超賣，適合找買點。" />
              <IndicatorRow label="Fear & Greed" value={`${fearGreed.value}`} status={fearGreed.value < 25 ? "STRONG BUY" : fearGreed.value < 40 ? "BUY" : "WAIT"} score={fearGreed.value < 20 ? 5 : fearGreed.value < 40 ? 4 : 1} tooltip="恐慌貪婪指數 (0-100)，越低代表市場越恐慌，是逆勢買入良機。" />
              <IndicatorRow label="BB %B (Weekly)" value={bb.pb.toFixed(2)} status={bb.pb < 0 ? "STRONG BUY" : bb.pb < 0.2 ? "BUY" : "WAIT"} score={bb.pb < 0 ? 5 : 2} tooltip="週線布林通道位置。數值 < 0 代表跌破週線下軌，極端超賣。" />
              <IndicatorRow label="Volatility (Weekly)" value={`${volatility}%`} status="WAIT" score={2} tooltip="週線波動率，波動變大往往意味著變盤在即。" />
              <div className="py-4 my-3 border-t border-b border-white/5">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Weekly Cycle Supports</h4>
                <IndicatorRow label="MA20 Weekly" value={`$${Math.floor(calculatedMAs.ma20w).toLocaleString()}`} status={currentP > calculatedMAs.ma20w ? "BUY" : "SELL"} score={currentP > calculatedMAs.ma20w ? 4 : 1} subValue="牛市支撐帶" tooltip="20週均線，牛市回調的健康支撐位。" />
                <IndicatorRow label="MA200 Weekly" value={`$${Math.floor(calculatedMAs.ma200w).toLocaleString()}`} status="STRONG BUY" score={5} subValue="週期大底" tooltip="200週均線，比特幣歷史上的極限大底，跌破機率極低。" />
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Col 3: Action & Derivatives */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-gradient-to-br from-blue-600/20 to-zinc-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-blue-500/30 shadow-lg shadow-blue-900/20 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-5 relative z-10">
               <h3 className="text-blue-400 font-extrabold text-sm uppercase flex items-center gap-2 tracking-wider">
                <CheckCircle2 size={16}/> Ready to Execute
              </h3>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-150"></div>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="relative z-10 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-full transition-all flex items-center justify-center gap-3 text-sm shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]">
              <Calculator size={18} /> 生成掛單策略
            </button>
          </div>

          <DashboardCard title="趨勢診斷" icon={BarChart3} className="flex-1">
             <div className="space-y-4">
               <div className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-400"><Scale size={16}/></div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Trend (Weekly)</span>
                  </div>
                  <span className={`text-base font-mono font-extrabold flex items-center gap-1.5 ${currentP > calculatedMAs.ma20w ? 'text-green-400' : 'text-red-400'}`}>
                    {currentP > calculatedMAs.ma20w ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    {currentP > calculatedMAs.ma20w ? "Bullish" : "Bearish"}
                  </span>
               </div>
               <div className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-full text-orange-400"><ArrowDown size={16}/></div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dip Depth</span>
                  </div>
                  <span className="text-base font-mono font-extrabold text-white">
                    {currentP > calculatedMAs.ma20w ? (
                        <span className="text-green-400 flex items-center gap-1"><ChevronsUp size={14}/> Above MA20W</span>
                    ) : (
                        `-${((calculatedMAs.ma20w - currentP)/calculatedMAs.ma20w * 100).toFixed(1)}%`
                    )}
                  </span>
               </div>
               <div className="text-[11px] text-zinc-500 text-center pt-2 font-medium">*基準為週線 MA20 (牛市支撐帶)。</div>
             </div>
          </DashboardCard>

          <div className="bg-zinc-900/70 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-400 uppercase tracking-wider"><ShieldCheck size={16} className="text-zinc-500"/> 情緒風控</div>
             <div className={`text-base font-extrabold ${fearGreed.value < 30 ? 'text-green-400' : 'text-orange-400'}`}>{fearGreed.value} ({fearGreed.value_classification})</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;