// Cached stock data attempt
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { setCachedData } = require('./cacheService');

const finnhubBaseURL = "https://finnhub.io/api/v1/quote?";
const FINNHUBKEY = process.env.FINNHUBKEY;
const WATCHLIST_FILE = path.join(__dirname, '../storage/stonkData.json');

// get real time stock data based on input from watchlist
const fetchRealTimeStockData = async(stockList) => {
    try {
        // Read existing stock data first
        let existingStockData = {};
        try {
            const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
            existingStockData = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, start with empty object
            console.log('No existing stock data file, creating new one');
        }

        // Fetch new data for requested tickers
        const newStockData = {};
        for (let i = 0; i < stockList.length; i++) {
            let response = await axios.get(`${finnhubBaseURL}symbol=${stockList[i]}&token=${FINNHUBKEY}`);
            let stockData = response.data;

            newStockData[stockList[i]] = [stockData.c, stockData.d, stockData.dp, stockData.o, stockData.pc];
        }

        // Merge new data with existing data
        const mergedStockData = {
            ...existingStockData,
            ...newStockData
        };

        console.log("✓ Fetched fresh stock data for", stockList.length, "tickers");
        console.log("✓ Total tickers in file:", Object.keys(mergedStockData).length);
        
        // Save merged data to file
        await fs.writeFile(WATCHLIST_FILE, JSON.stringify(mergedStockData, null, 2));
        
        // Update cache metadata timestamp
        await setCachedData('stockData', mergedStockData);
        
        return mergedStockData;
    } catch (error) {
        console.error('Error fetching stock data:', error.message);
        return null;
    }
};

const getStockData = async() => {
    try {
        const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist, return empty object
        return {};
    }
};

module.exports = {
    fetchRealTimeStockData,
    getStockData
};