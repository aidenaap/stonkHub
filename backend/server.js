// Imports
require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { 
   fetchLobbying, 
   fetchHistoricalLobbying,
   fetchCongressTrading,
   fetchHistoricalCongressTrading,
   fetchGovContracts,
   fetchHistoricalGovContracts
} = require('./services/quiverService');
const { fetchNewsData } = require('./services/newsService');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('./services/watchlistService');
const { fetchRealTimeStockData, getStockData } = require('./services/stockService');
const { getStockList, getLegislatorList } = require('./services/staticServices');
const { summarizeArticle } = require('./services/openaiService');

// Caching
const { getCachedData, setCachedData, getCachedStockData } = require('./services/cacheService');

// App setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('frontend/public'));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Base Routing
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});


// Lobbying endpoints
app.get('/api/lobbying', async (req, res) => {
   // Try to get cached data first
   let data = await getCachedData('lobbying');
   
   if (!data) {
       // Cache miss or stale - fetch fresh data
       data = await fetchLobbying();
       if (data) {
           await setCachedData('lobbying', data);
       }
   }
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: 'Failed to fetch lobbying data' });
   }
});
app.get('/api/lobbying/:ticker', async (req, res) => {
   const { ticker } = req.params;
   const { page, page_size, query, queryTicker } = req.query;
   
   const data = await fetchHistoricalLobbying(ticker, {
       page,
       page_size,
       query,
       queryTicker
   });
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: `Failed to fetch historical lobbying data for ${ticker}` });
   }
});

// Congress trading endpoints
app.get('/api/congress', async (req, res) => {
   let data = await getCachedData('congress');
   
   if (!data) {
       data = await fetchCongressTrading({ normalized: req.query.normalized, representative: req.query.representative });
       if (data) {
           await setCachedData('congress', data);
       }
   }
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: 'Failed to fetch congress trading data' });
   }
});
app.get('/api/congress/:ticker', async (req, res) => {
   const { ticker } = req.params;
   const { analyst, page, page_size } = req.query;
   
   const data = await fetchHistoricalCongressTrading(ticker, {
       analyst,
       page,
       page_size
   });
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: `Failed to fetch historical congress trading data for ${ticker}` });
   }
});

// Government contracts endpoints
app.get('/api/contracts', async (req, res) => {
   let data = await getCachedData('contracts');
   
   if (!data) {
       data = await fetchGovContracts({ date: req.query.date, page: req.query.page, page_size: req.query.page_size });
       if (data) {
           await setCachedData('contracts', data);
       }
   }
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: 'Failed to fetch government contracts data' });
   }
});
app.get('/api/contracts/:ticker', async (req, res) => {
   const { ticker } = req.params;
   const { page, page_size } = req.query;
   
   const data = await fetchHistoricalGovContracts(ticker, {
       page,
       page_size
   });
   
   if (data) {
       res.json(data);
   } else {
       res.status(500).json({ error: `Failed to fetch historical government contracts data for ${ticker}` });
   }
});

// News endpoints
app.get('/api/news', async(req, res) => {
    let data = await getCachedData('news');
    
    if (!data) {
        data = await fetchNewsData();
        if (data) {
            await setCachedData('news', data);
        }
    }
    
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to fetch news data' });
    }
});
app.post('/api/news/summarize', async (req, res) => { // AI Summary endpoint
    try {
        const { url, title, description } = req.body;
        
        if (!url || !title) {
            return res.status(400).json({ error: 'URL and title are required' });
        }

        const summary = await summarizeArticle(url, title, description);
        res.json(summary);
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate AI summary' });
    }
});

// Watchlist endpoints
app.get('/api/watchlist', async (req, res) => {
    try {
        const watchlist = await getWatchlist();
        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get watchlist' });
    }
});
  
app.post('/api/watchlist', async (req, res) => {
    try {
        const { ticker } = req.body;
        console.log("Ticker in the watchlist endpoint serverjs: ", ticker);
        const watchlist = await addToWatchlist(ticker);
        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

app.delete('/api/watchlist/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const watchlist = await removeFromWatchlist(ticker);
        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
});

// Stock data endpoints
// get from file storage
app.get('/api/stocklist', async(req, res) => {
    try {
        const jsonStockData = await getStockData();
        res.json(jsonStockData);
    } catch {
        res.status(500).json({error: 'Failed to get stocklist'});
    }
});
// get from finnhub and save to file storage
// app.post('/api/stocklist', async (req, res) => {
//   try {
//     console.log("req.body:", req.body);
//     const { stocklist } = req.body;

//     if (!stocklist || !Array.isArray(stocklist)) {
//       return res.status(400).json({ error: 'Invalid stocklist' });
//     }

//     const stockData = await fetchRealTimeStockData(stocklist);
//     res.json(stockData);
//   } catch (error) {
//     console.error('Error in /stocklist route:', error.message);
//     res.status(500).json({ error: 'Failed to get stocklist' });
//   }
// });
// get from finnhub and save to file storage
app.post('/api/stocklist', async (req, res) => {
  try {
    const { stocklist } = req.body;

    if (!stocklist || !Array.isArray(stocklist)) {
      return res.status(400).json({ error: 'Invalid stocklist' });
    }

    // Check if we have valid cached stock data
    let stockData = await getCachedStockData();
    
    if (stockData) {
      // Verify cached data has all requested tickers WITH VALID PRICE DATA
      const allTickersValid = stocklist.every(ticker => {
        const data = stockData[ticker];
        // Check if ticker exists AND has valid price data (not null, not empty array)
        return data && 
               Array.isArray(data) && 
               data.length > 0 && 
               data[0] !== null && 
               data[0] !== undefined &&
               !isNaN(data[0]);
      });
      
      if (allTickersValid) {
        console.log('Returning cached stock data (all tickers have valid prices)');
        return res.json(stockData);
      } else {
        console.log('Cache incomplete or has invalid data - fetching fresh data');
      }
    }

    // Cache miss or incomplete - fetch fresh data
    console.log('Fetching fresh stock data from Finnhub...');
    stockData = await fetchRealTimeStockData(stocklist);
    
    if (!stockData) {
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
    
    res.json(stockData);
  } catch (error) {
    console.error('Error in /api/stocklist route:', error.message);
    res.status(500).json({ error: 'Failed to get stocklist' });
  }
});

// Static stock/legislator information from JSON
app.get('/api/search/stocks', async (req, res) => {
    try {
        const stockList = await getStockList();
        res.json(stockList);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stock list for search' });
    }
});
app.get('/api/search/legislators', async (req, res) => {
    try {
        const legislators = await getLegislatorList();
        res.json(legislators);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get legislator list' });
    }
});

// App Startup
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});