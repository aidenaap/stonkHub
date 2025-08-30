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

// App Startup
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});