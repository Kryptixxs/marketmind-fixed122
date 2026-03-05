'use client';

import { useState, useEffect, useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { fetchNews } from '@/app/actions/fetchNews';
import { analyzeMarket } from '@/app/actions/analyzeMarket';
import { Brain, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

const RESEARCH_SYMBOLS = ['NAS100', 'SPX500', 'US30', 'GOLD', 'CRUDE', 'EURUSD', 'BTCUSD'];

interface AIAnalysis {
    symbol: string;
    strength: number;
    sentiment: string;
    analysis: string;
    loading: boolean;
}

export default function ResearchPage() {
    const [activeSymbol, setActiveSymbol] = useState('NAS100');
    const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
    const [news, setNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('General');

    const { data: marketData } = useMarketData(RESEARCH_SYMBOLS);

    // Fetch AI analysis for active symbol
    useEffect(() => {
        const tick = marketData[activeSymbol];
        if (!tick || analyses[activeSymbol]?.loading === false) return;

        setAnalyses(prev => ({ ...prev, [activeSymbol]: { symbol: activeSymbol, strength: 0, sentiment: '', analysis: '', loading: true } }));

        analyzeMarket(activeSymbol, activeSymbol, tick.price, tick.changePercent)
            .then(result => {
                setAnalyses(prev => ({
                    ...prev,
                    [activeSymbol]: {
                        symbol: activeSymbol,
                        strength: result.strength,
                        sentiment: result.sentiment,
                        analysis: result.analysis,
                        loading: false,
                    }
                }));
            })
            .catch(() => {
                setAnalyses(prev => ({
                    ...prev,
                    [activeSymbol]: { symbol: activeSymbol, strength: 50, sentiment: 'Neutral', analysis: 'Analysis unavailable.', loading: false }
                }));
            });
    }, [activeSymbol, marketData[activeSymbol]?.price]);

    // Fetch news
    useEffect(() => {
        setNewsLoading(true);
        fetchNews(selectedCategory).then(data => {
            setNews(data);
            setNewsLoading(false);
        });
    }, [selectedCategory]);

    const currentAnalysis = analyses[activeSymbol];
    const activeTick = marketData[activeSymbol];

    // Macro overview grid
    const macroGrid = useMemo(() => {
        return RESEARCH_SYMBOLS.map(sym => {
            const tick = marketData[sym];
            return {
                symbol: sym,
                price: tick?.price || 0,
                change: tick?.changePercent || 0,
            };
        });
    }, [marketData]);

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />

            {/* Header */}
            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <Brain size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest">Research Terminal</h1>
                <div className="h-4 w-px bg-border" />
                <span className="text-[9px] font-bold text-accent">{activeSymbol}</span>
                <span className="bb-status-live">AI ENABLED</span>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Symbol List + Macro Overview */}
                <div className="w-52 border-r border-border bg-surface shrink-0 flex flex-col overflow-y-auto">
                    <div className="p-2 border-b border-border">
                        <div className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Market Monitor</div>
                    </div>
                    {macroGrid.map(item => {
                        const isActive = activeSymbol === item.symbol;
                        return (
                            <button key={item.symbol} onClick={() => setActiveSymbol(item.symbol)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-b border-border/30 ${isActive ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-surface-highlight'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold ${isActive ? 'text-accent' : 'text-text-primary'}`}>{item.symbol}</span>
                                <div className="text-right">
                                    <div className="text-[10px] tabular-nums">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className={`text-[9px] tabular-nums font-bold ${item.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Center: AI Analysis + Research */}
                <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-3">
                    {/* AI Analysis Panel */}
                    <TerminalPanel title={`AI Analysis — ${activeSymbol}`} fnKey="F1">
                        <div className="p-4">
                            {currentAnalysis?.loading ? (
                                <div className="flex items-center justify-center gap-2 py-8">
                                    <Loader2 size={16} className="animate-spin text-accent" />
                                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Generating institutional analysis...</span>
                                </div>
                            ) : currentAnalysis ? (
                                <div className="space-y-4">
                                    {/* Signal Header */}
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 border ${currentAnalysis.sentiment === 'Bullish' ? 'border-positive/30 bg-positive/5 text-positive' :
                                                currentAnalysis.sentiment === 'Bearish' ? 'border-negative/30 bg-negative/5 text-negative' :
                                                    'border-border bg-surface text-text-secondary'
                                            }`}>
                                            {currentAnalysis.sentiment === 'Bullish' ? <TrendingUp size={14} /> :
                                                currentAnalysis.sentiment === 'Bearish' ? <TrendingDown size={14} /> :
                                                    <Minus size={14} />}
                                            <span className="text-[11px] font-bold uppercase">{currentAnalysis.sentiment}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-text-tertiary uppercase">Strength</span>
                                            <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                                                <div className={`h-full transition-all ${currentAnalysis.strength > 70 ? 'bg-positive' : currentAnalysis.strength > 40 ? 'bg-warning' : 'bg-negative'
                                                    }`} style={{ width: `${currentAnalysis.strength}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold tabular-nums">{currentAnalysis.strength}/100</span>
                                        </div>
                                    </div>

                                    {/* Analysis Text */}
                                    <div className="p-3 bg-background border border-border/50">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Sparkles size={10} className="text-accent" />
                                            <span className="text-[8px] font-bold text-accent uppercase tracking-wider">AI SYNTHESIS</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary leading-relaxed">{currentAnalysis.analysis}</p>
                                    </div>

                                    {/* Quick Data */}
                                    {activeTick && (
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="p-2 bg-surface border border-border">
                                                <div className="text-[8px] text-text-tertiary uppercase">Price</div>
                                                <div className="text-[12px] font-bold tabular-nums">{activeTick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <div className="p-2 bg-surface border border-border">
                                                <div className="text-[8px] text-text-tertiary uppercase">Change</div>
                                                <div className={`text-[12px] font-bold tabular-nums ${activeTick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {activeTick.changePercent >= 0 ? '+' : ''}{activeTick.changePercent.toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="p-2 bg-surface border border-border">
                                                <div className="text-[8px] text-text-tertiary uppercase">Market</div>
                                                <div className="text-[12px] font-bold">{activeTick.marketState}</div>
                                            </div>
                                            <div className="p-2 bg-surface border border-border">
                                                <div className="text-[8px] text-text-tertiary uppercase">Currency</div>
                                                <div className="text-[12px] font-bold">{activeTick.currency}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-tertiary text-[10px]">Select a symbol to generate analysis</div>
                            )}
                        </div>
                    </TerminalPanel>
                </div>

                {/* Right: News Feed */}
                <div className="w-80 border-l border-border shrink-0 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-border bg-surface flex items-center gap-2 shrink-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-accent">Intelligence Wire</div>
                        <div className="flex-1" />
                        {['General', 'Stock', 'Crypto', 'Forex'].map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)}
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase transition-colors ${selectedCategory === c ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary'
                                    }`}
                            >{c}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {newsLoading ? (
                            <div className="flex justify-center pt-12"><Loader2 size={16} className="animate-spin text-accent" /></div>
                        ) : (
                            news.map((article, i) => (
                                <a key={i} href={article.link} target="_blank" rel="noopener noreferrer"
                                    className="block px-3 py-2.5 border-b border-border/30 hover:bg-surface-highlight transition-colors group"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-bold text-accent">{article.source}</span>
                                        <span className="text-[8px] text-text-muted">{article.time}</span>
                                        <ExternalLink size={8} className="text-text-muted opacity-0 group-hover:opacity-100 ml-auto" />
                                    </div>
                                    <h3 className="text-[10px] font-bold text-text-primary leading-snug mb-1 group-hover:text-white line-clamp-2">{article.title}</h3>
                                    {article.contentSnippet && (
                                        <p className="text-[9px] text-text-tertiary leading-tight line-clamp-2">{article.contentSnippet}</p>
                                    )}
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
