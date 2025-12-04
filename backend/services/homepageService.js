const fs = require('fs').promises;
const path = require('path');

const HOMEPAGE_CACHE_FILE = path.join(__dirname, '../storage/homepageCache.json');

/**
 * Calculate Congressional Greed/Fear Index (0-10 scale)
 * 0 = Maximum Fear (all selling), 10 = Maximum Greed (all buying)
 */
function calculateGreedFearIndex(congressData) {
    let purchaseCount = 0;
    let saleCount = 0;
    
    congressData.forEach(trade => {
        const transaction = trade.Transaction.toLowerCase();
        if (transaction.includes('purchase') || transaction.includes('buy')) {
            purchaseCount++;
        } else if (transaction.includes('sale') || transaction.includes('sell')) {
            saleCount++;
        }
    });
    
    const totalTrades = purchaseCount + saleCount;
    if (totalTrades === 0) return 5; // Neutral if no data
    
    // Calculate ratio: more purchases = higher index (greed)
    const purchaseRatio = purchaseCount / totalTrades;
    const index = Math.round(purchaseRatio * 10);
    
    return {
        index,
        purchaseCount,
        saleCount,
        totalTrades
    };
}

/**
 * Extract noticeably large trades (highlighted rows)
 * Amount >= $50,001 based on shouldHighlightRow logic
 */
function getNoticeableTrades(congressData) {
    return congressData
        .filter(trade => {
            const amount = parseFloat(trade.Amount) || 0;
            return amount >= 50001;
        })
        .sort((a, b) => parseFloat(b.Amount) - parseFloat(a.Amount))
        .slice(0, 20); // Top 20 large trades
}

/**
 * Find stocks with 3+ trades in past 3 months
 */
function getFrequentTrades(congressData) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Group by ticker
    const tickerCounts = {};
    
    congressData.forEach(trade => {
    const reportDate = new Date(trade.ReportDate);
        if (reportDate >= threeMonthsAgo) {
            const ticker = trade.Ticker;
            if (!tickerCounts[ticker]) {
                tickerCounts[ticker] = {
                    ticker,
                    count: 0,
                    trades: []
                };
            }
            tickerCounts[ticker].count++;
            tickerCounts[ticker].trades.push(trade);
        }
    });
    
    // Filter for 3+ trades
    return Object.values(tickerCounts)
        .filter(item => item.count >= 3)
        .sort((a, b) => b.count - a.count);
}

/**
 * Find stocks appearing 10+ times across all data sources in past 6 months
 */
function getMultipleIndicators(congressData, lobbyingData, contractData) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const tickerActivity = {};
    
    // Count congress trades
    congressData.forEach(trade => {
        const reportDate = new Date(trade.ReportDate);
        if (reportDate >= sixMonthsAgo) {
            const ticker = trade.Ticker;
            if (!tickerActivity[ticker]) {
                tickerActivity[ticker] = {
                    ticker,
                    congressCount: 0,
                    lobbyingCount: 0,
                    contractCount: 0,
                    totalCount: 0,
                    activities: []
                };
            }
            tickerActivity[ticker].congressCount++;
            tickerActivity[ticker].totalCount++;
            tickerActivity[ticker].activities.push({
                type: 'congress',
                date: trade.ReportDate,
                details: trade
            });
        }
    });
    
    // Count lobbying activity
    lobbyingData.forEach(item => {
        const date = new Date(item.Date);
        if (date >= sixMonthsAgo) {
            const ticker = item.Ticker;
            if (!tickerActivity[ticker]) {
                tickerActivity[ticker] = {
                    ticker,
                    congressCount: 0,
                    lobbyingCount: 0,
                    contractCount: 0,
                    totalCount: 0,
                    activities: []
                };
            }
            tickerActivity[ticker].lobbyingCount++;
            tickerActivity[ticker].totalCount++;
            tickerActivity[ticker].activities.push({
                type: 'lobbying',
                date: item.Date,
                details: item
            });
        }
    });
    
    // Count contract awards
    contractData.forEach(item => {
        const date = new Date(item.Date);
        if (date >= sixMonthsAgo) {
            const ticker = item.Ticker;
            if (!tickerActivity[ticker]) {
                tickerActivity[ticker] = {
                    ticker,
                    congressCount: 0,
                    lobbyingCount: 0,
                    contractCount: 0,
                    totalCount: 0,
                    activities: []
                };
            }
            tickerActivity[ticker].contractCount++;
            tickerActivity[ticker].totalCount++;
            tickerActivity[ticker].activities.push({
                type: 'contract',
                date: item.Date,
                details: item
            });
        }
    });
    
    // Filter for 10+ total occurrences
    return Object.values(tickerActivity)
        .filter(item => item.totalCount >= 10)
        .sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Generate and cache homepage data
 */
async function generateHomepageCache(congressData, lobbyingData, contractData) {
    try {
        const homepageData = {
            lastUpdated: new Date().toISOString(),
            greedFearIndex: calculateGreedFearIndex(congressData),
            noticeableTrades: getNoticeableTrades(congressData),
            frequentTrades: getFrequentTrades(congressData),
            multipleIndicators: getMultipleIndicators(congressData, lobbyingData, contractData)
        };
        
        await fs.writeFile(HOMEPAGE_CACHE_FILE, JSON.stringify(homepageData, null, 2));
        console.log('✓ Homepage cache updated successfully');
        
        return homepageData;
    } catch (error) {
        console.error('Error generating homepage cache:', error);
        return null;
    }
}

module.exports = {
    generateHomepageCache
};