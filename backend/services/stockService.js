const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const finnhubBaseURL = "https://finnhub.io/api/v1/quote?";
const FINNHUBKEY = process.env.FINNHUBKEY;
const WATCHLIST_FILE = path.join(__dirname, '../storage/stonkData.json');

// get real time stock data based on input from watchlist
const fetchRealTimeStockData = async(stockList) => {
    try {
        const stockAPIData = {};

        for (let i = 0; i < stockList.length; i++) {
            let response = await axios.get(`${finnhubBaseURL}symbol=${stockList[i]}&token=${FINNHUBKEY}`);
            let stockData = response.data;

            stockAPIData[stockList[i]] = [stockData.c, stockData.d, stockData.dp, stockData.o, stockData.pc]; // current, percent change, previous close
        }

        // real time stockdata
        console.log("writing updated values to realtime stock data");
        // Save data back to file
         await fs.writeFile(WATCHLIST_FILE, JSON.stringify(stockAPIData, null, 2));
        return stockAPIData;
    } catch (error) {
        console.error('Error fetching stock data:', error.message);
    
        return null;
    }
};

const getStockData = async(stockList) => {
    try {
        const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist, return empty array
        return [];
    }
};

module.exports =  {
    fetchRealTimeStockData,
    getStockData
}