const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { setCachedData } = require('./cacheService');

const SECTOR_CACHE_FILE = path.join(__dirname, '../storage/sectorCache.json');

// Sector ETFs mapping
const SECTOR_ETFS = [
    { symbol: 'XLK', name: 'Technology', color: '#3b82f6' },
    { symbol: 'XLF', name: 'Financials', color: '#10b981' },
    { symbol: 'XLV', name: 'Healthcare', color: '#ef4444' },
    { symbol: 'XLE', name: 'Energy', color: '#f59e0b' },
    { symbol: 'XLI', name: 'Industrials', color: '#6366f1' },
    { symbol: 'XLY', name: 'Consumer Discretionary', color: '#ec4899' },
    { symbol: 'XLP', name: 'Consumer Staples', color: '#14b8a6' },
    { symbol: 'XLU', name: 'Utilities', color: '#8b5cf6' },
    { symbol: 'XLRE', name: 'Real Estate', color: '#f97316' },
    { symbol: 'XLB', name: 'Materials', color: '#84cc16' },
    { symbol: 'XLC', name: 'Communication Services', color: '#06b6d4' }
];

// Market overview symbols
const MARKET_SYMBOLS = {
    '^GSPC': { name: 'S&P 500', shortName: 'SPX' },
    '^RUT': { name: 'Russell 2000', shortName: 'RUT' },
    'DX-Y.NYB': { name: 'Dollar Index', shortName: 'DXY' },
    '^VIX': { name: 'VIX', shortName: 'VIX' },
    'BTC-USD': { name: 'Bitcoin', shortName: 'BTC' },
    'GC=F': { name: 'Gold', shortName: 'GOLD' },
    'SI=F': { name: 'Silver', shortName: 'SILVER' },
    'CL=F': { name: 'Crude Oil', shortName: 'OIL' },
    'SPY': { name: 'SPDR S&P 500', shortName: 'SPY' },
    'QQQ': { name: 'Invesco QQQ', shortName: 'QQQ' }
};

/**
 * Fetch sector ETF data from Yahoo Finance
 */
async function fetchSectorData() {
    try {
        console.log('Fetching sector ETF data from Yahoo Finance...');
        
        const sectorData = [];
        
        for (const sector of SECTOR_ETFS) {
            try {
                const response = await axios.get(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${sector.symbol}`,
                    {
                        params: {
                            interval: '1d',
                            range: '2d'
                        },
                        timeout: 10000
                    }
                );
                
                const result = response.data.chart.result[0];
                const meta = result.meta;
                const quotes = result.indicators.quote[0];
                
                // Get current price and previous close
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                
                // Calculate change
                const change = currentPrice - previousClose;
                const percentChange = ((change / previousClose) * 100);
                
                sectorData.push({
                    symbol: sector.symbol,
                    name: sector.name,
                    color: sector.color,
                    price: parseFloat(currentPrice.toFixed(2)),
                    change: parseFloat(change.toFixed(2)),
                    percentChange: parseFloat(percentChange.toFixed(2)),
                    previousClose: parseFloat(previousClose.toFixed(2)),
                    isPositive: change >= 0
                });
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error fetching ${sector.symbol}:`, error.message);
                sectorData.push({
                    symbol: sector.symbol,
                    name: sector.name,
                    color: sector.color,
                    price: null,
                    change: null,
                    percentChange: null,
                    previousClose: null,
                    isPositive: null,
                    error: true
                });
            }
        }
        
        // Sort by percent change (best performers first)
        sectorData.sort((a, b) => {
            if (a.percentChange === null) return 1;
            if (b.percentChange === null) return -1;
            return b.percentChange - a.percentChange;
        });
        
        const cacheData = {
            lastUpdated: new Date().toISOString(),
            sectors: sectorData
        };
        
        // Save to cache file
        await fs.writeFile(SECTOR_CACHE_FILE, JSON.stringify(cacheData, null, 2));
        console.log('✓ Sector data cached successfully');
        
        // Update cache metadata
        await setCachedData('sectors', cacheData);
        
        return cacheData;
        
    } catch (error) {
        console.error('Error fetching sector data:', error.message);
        return null;
    }
}

/**
 * Get cached sector data
 */
async function getSectorData() {
    try {
        const data = await fs.readFile(SECTOR_CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

/**
 * Get sector performance summary
 */
async function getSectorSummary() {
    const data = await getSectorData();
    if (!data || !data.sectors) return null;
    
    const validSectors = data.sectors.filter(s => s.percentChange !== null);
    
    const advancing = validSectors.filter(s => s.isPositive).length;
    const declining = validSectors.length - advancing;
    
    const bestSector = validSectors[0];
    const worstSector = validSectors[validSectors.length - 1];
    
    const avgChange = validSectors.reduce((sum, s) => sum + s.percentChange, 0) / validSectors.length;
    
    return {
        advancing,
        declining,
        bestSector,
        worstSector,
        averageChange: parseFloat(avgChange.toFixed(2)),
        marketSentiment: avgChange > 0.5 ? 'Bullish' : avgChange < -0.5 ? 'Bearish' : 'Neutral'
    };
}

/**
 * Fetch market overview data (indices, commodities, crypto)
 */
async function fetchMarketOverview() {
    try {
        const marketData = [];
        
        for (const [symbol, info] of Object.entries(MARKET_SYMBOLS)) {
            try {
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                    params: {
                        interval: '1d',
                        range: '2d'
                    }
                });
                
                const result = response.data.chart.result[0];
                const meta = result.meta;
                const quote = result.indicators.quote[0];
                
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;
                
                marketData.push({
                    symbol: symbol,
                    shortName: info.shortName,
                    name: info.name,
                    price: currentPrice,
                    change: change,
                    changePercent: changePercent,
                    isPositive: change >= 0
                });
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error.message);
                marketData.push({
                    symbol: symbol,
                    shortName: info.shortName,
                    name: info.name,
                    price: null,
                    change: null,
                    changePercent: null,
                    isPositive: null,
                    error: true
                });
            }
        }
        
        console.log(`✓ Fetched market overview for ${marketData.length} symbols`);
        return marketData;
    } catch (error) {
        console.error('Error fetching market overview:', error);
        return null;
    }
}

/**
 * Get cached market overview or fetch fresh
 */
async function getMarketOverview() {
    try {
        const cacheFile = path.join(__dirname, '../storage/marketOverviewCache.json');
        const data = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}



module.exports = {
    fetchSectorData,
    getSectorData,
    getSectorSummary,
    fetchMarketOverview,
    getMarketOverview
};