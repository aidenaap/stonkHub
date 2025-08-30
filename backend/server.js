// Imports
require('dotenv').config();
const express = require('express');
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

// App setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('frontend/public'));

// Fetch live data on startup
fetchLobbying();
fetchCongressTrading();
fetchGovContracts();

// Endpoints
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});


// Lobbying endpoints
app.get('/api/lobbying', async (req, res) => {
   const data = await fetchLobbying();
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
   const { normalized, representative } = req.query;
   const data = await fetchCongressTrading({ normalized, representative });
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
   const { date, page, page_size } = req.query;
   const data = await fetchGovContracts({ date, page, page_size });
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

// News endpoint 
app.get('/api/news', async(req, res) => {
    const data = await fetchNewsData();
    if (data) {
        res.json(data)
    } else {
       res.status(500).json({ error: 'Failed to fetch government contracts data' });
    }
});

// Watchlist endpoints
// app.get('/api/watchlist', async (req, res) => {
//     try {
//         const watchlist = await getWatchlist();
//         res.json(watchlist);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to get watchlist' });
//     }
// });

// app.post('/api/watchlist', async (req, res) => {
//     try {
//         const { ticker } = req.body;
//         const watchlist = await addToWatchlist(ticker);
//         res.json(watchlist);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to add to watchlist' });
//     }
// });

// app.delete('/api/watchlist/:ticker', async (req, res) => {
//     try {
//         const { ticker } = req.params;
//         const watchlist = await removeFromWatchlist(ticker);
//         res.json(watchlist);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to remove from watchlist' });
//     }
// });

// App Startup
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});